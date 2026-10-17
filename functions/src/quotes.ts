import * as functions from "firebase-functions/v1";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

// Prototype treasury rates pegged to USD (units of currency per 1 USD).
const TREASURY_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  CHF: 0.90,
  GBP: 0.77,
  NGN: 1650.00,
};

// Flat transaction fee, expressed in USD and converted into the source currency.
const FEE_USD = 2700;

/** Units of `currency` per 1 USD (live, with treasury fallback). */
async function usdTo(currency: string): Promise<number> {
  if (currency === "USD") return 1;
  try {
    if (currency === "NGN") throw new Error("NGN unsupported by live API");
    const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${currency}`);
    if (!response.ok) throw new Error("FX API failed");
    const data: any = await response.json();
    const rate = data.rates?.[currency];
    if (!rate) throw new Error("no rate");
    return rate;
  } catch {
    return TREASURY_RATES[currency] ?? 1;
  }
}

export const getTransferQuote = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const { sourceAccountId, destinationCurrency, amount, type } = data;
  const uid = context.auth.uid;
  const db = getFirestore();

  if (amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive');

  // 1. Get source currency
  const sourceRef = db.collection(`users/${uid}/accounts`).doc(sourceAccountId);
  const sourceDoc = await sourceRef.get();
  if (!sourceDoc.exists) throw new functions.https.HttpsError('not-found', 'Source account not found');
  
  const sourceCurrency = sourceDoc.data()!.currency;

  // 2. Recipient/type validation. The server — not the client — decides whether
  // a number is a Swentra account, so a wire can never silently skip crediting.
  const recipientAcct = String(data.recipientAccountNumber || '').replace(/\s/g, '');
  if (type === 'SWENTRA_TRANSFER') {
    if (!recipientAcct) {
      throw new functions.https.HttpsError('invalid-argument', 'Recipient account number is required');
    }
    const reg = await db.collection('accountNumbers').doc(recipientAcct).get();
    if (!reg.exists) {
      throw new functions.https.HttpsError('failed-precondition', "No Swentra Vault account with that number — use 'New recipient'.");
    }
  } else if (type === 'EXTERNAL_WIRE') {
    if (recipientAcct) {
      const reg = await db.collection('accountNumbers').doc(recipientAcct).get();
      if (reg.exists) {
        throw new functions.https.HttpsError('failed-precondition', "That's a Swentra Vault account — use 'Swentra transfer' so the recipient is credited instantly.");
      }
    }
  }

  // 3. Fetch live FX if needed
  let rawRate = 1.0;
  if (sourceCurrency !== destinationCurrency) {
    try {
      // Frankfurter API does not support NGN, so if either currency is NGN, we bypass it.
      if (sourceCurrency === 'NGN' || destinationCurrency === 'NGN') {
        throw new Error('Unsupported currency in live API, fallback to treasury rates');
      }

      const response = await fetch(`https://api.frankfurter.app/latest?from=${sourceCurrency}&to=${destinationCurrency}`);
      if (!response.ok) throw new Error('FX API failed');
      const fxData: any = await response.json();
      rawRate = fxData.rates[destinationCurrency];
    } catch (error) {
      // Fallback to internal treasury rates pegged to USD
      const sourceInUSD = TREASURY_RATES[sourceCurrency];
      const destInUSD = TREASURY_RATES[destinationCurrency];

      if (!sourceInUSD || !destInUSD) {
        throw new functions.https.HttpsError('unavailable', 'Exchange rate service is currently down [503]');
      }

      // Calculate cross rate
      rawRate = destInUSD / sourceInUSD;
    }
  }

  // 4. Apply Bank Spread (1.5%)
  // If converting, bank gives slightly less destination currency per source currency
  const exchangeRate = sourceCurrency === destinationCurrency ? 1.0 : rawRate * 0.985;

  // 5. Fee — flat $2700 USD-equivalent, converted into the source currency.
  // Own-account moves (INTERNAL_TRANSFER) are free.
  let fee = 0;
  if (type === 'SWENTRA_TRANSFER' || type === 'EXTERNAL_WIRE') {
    const usdRate = await usdTo(sourceCurrency);
    fee = Math.round(FEE_USD * usdRate * 100) / 100;
  }

  const totalDebit = amount + fee;
  const convertedAmount = amount * exchangeRate;

  // 6. Store Quote
  const quoteRef = db.collection('transferQuotes').doc();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

  await quoteRef.set({
    userId: uid,
    sourceAccountId,
    sourceCurrency,
    destinationCurrency,
    principalAmount: amount,
    fee,
    totalDebit,
    exchangeRate,
    convertedAmount,
    type,
    expiresAt: Timestamp.fromDate(expiresAt),
    status: 'ACTIVE',
    createdAt: FieldValue.serverTimestamp()
  });

  return {
    quoteId: quoteRef.id,
    sourceCurrency,
    destinationCurrency,
    principalAmount: amount,
    fee,
    totalDebit,
    exchangeRate,
    convertedAmount,
    expiresAt: expiresAt.toISOString()
  };
});
