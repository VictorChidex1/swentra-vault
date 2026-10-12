import * as functions from "firebase-functions/v1";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

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

  // 2. Fetch live FX if needed
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
      const TREASURY_RATES: Record<string, number> = {
        USD: 1.0,
        EUR: 0.92,
        CHF: 0.90,
        GBP: 0.77,
        NGN: 1650.00
      };

      const sourceInUSD = TREASURY_RATES[sourceCurrency];
      const destInUSD = TREASURY_RATES[destinationCurrency];

      if (!sourceInUSD || !destInUSD) {
        throw new functions.https.HttpsError('unavailable', 'Exchange rate service is currently down [503]');
      }

      // Calculate cross rate
      rawRate = destInUSD / sourceInUSD;
    }
  }

  // 3. Apply Bank Spread (1.5%)
  // If converting, bank gives slightly less destination currency per source currency
  const exchangeRate = sourceCurrency === destinationCurrency ? 1.0 : rawRate * 0.985;

  // 4. Calculate Fee
  let fee = 0;
  if (type === 'EXTERNAL_WIRE') {
    fee = 15.00; // Flat $15 or equivalent fee for wires
  } else if (type === 'SWENTRA_TRANSFER') {
    fee = 0.00; // Free for Swentra users
  } else if (type === 'INTERNAL_TRANSFER') {
    fee = 0.00; // Free for own accounts
  }

  const totalDebit = amount + fee;
  const convertedAmount = amount * exchangeRate;

  // 5. Store Quote
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