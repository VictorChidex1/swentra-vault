import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendTransactionConfirmationEmail, sendIncomingTransferEmail } from "./emails";

export const executeTransfer = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { quoteId, recipientDetails, reference } = data;
  const uid = context.auth.uid;
  const db = getFirestore();

  if (!quoteId) throw new functions.https.HttpsError('invalid-argument', 'Missing quote ID');

  const adminQuery = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (adminQuery.empty) throw new functions.https.HttpsError('internal', 'Treasury uninitialized');
  const adminUid = adminQuery.docs[0].id;

  let transferType: string = "";
  let destUidForNotify: string | null = null;
  let recipientTxId: string | null = null;

  const result = await db.runTransaction(async (t) => {
    // 0. Verify Quote
    const quoteRef = db.collection('transferQuotes').doc(quoteId);
    const quoteDoc = await t.get(quoteRef);
    if (!quoteDoc.exists) throw new functions.https.HttpsError('not-found', 'Quote not found');
    
    const quote = quoteDoc.data()!;
    if (quote.userId !== uid) throw new functions.https.HttpsError('permission-denied', 'Not your quote');
    if (quote.status !== 'ACTIVE') throw new functions.https.HttpsError('failed-precondition', 'Quote is no longer active');
    
    if (quote.expiresAt.toDate() < new Date()) {
      t.update(quoteRef, { status: 'EXPIRED' });
      throw new functions.https.HttpsError('deadline-exceeded', 'Quote has expired');
    }

    const { sourceAccountId, type, principalAmount: amount, totalDebit, convertedAmount: destinationAmount, exchangeRate, fee } = quote;
    transferType = type;

    // 1. Get Sender Account
    const sourceRef = db.collection(`users/${uid}/accounts`).doc(sourceAccountId);
    const sourceDoc = await t.get(sourceRef);
    if (!sourceDoc.exists) throw new functions.https.HttpsError('not-found', 'Source account not found');
    
    const sourceData = sourceDoc.data()!;
    if (sourceData.availableBalance < totalDebit) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds to cover amount and fees');
    }

    // Prepare debits
    const newSourceBalance = sourceData.balance - totalDebit;
    const newSourceAvailable = sourceData.availableBalance - totalDebit;

    let destinationAccountId: string | null = null;
    let destinationUid: string | null = null;
    let destRef = null;
    let destDoc = null;

    if (type === 'SWENTRA_TRANSFER' || type === 'INTERNAL_TRANSFER') {
      const accountNumberToFind = recipientDetails.accountNumber.replace(/\s/g, '');
      const registryRef = db.collection('accountNumbers').doc(accountNumberToFind);
      const registryDoc = await t.get(registryRef);
      
      if (!registryDoc.exists) {
        throw new functions.https.HttpsError('failed-precondition', "No Swentra Vault account with that number — use 'New recipient'.");
      }

      destinationUid = registryDoc.data()!.assignedTo;
      destinationAccountId = registryDoc.data()!.accountId;
      destUidForNotify = destinationUid;

      destRef = db.collection(`users/${destinationUid}/accounts`).doc(destinationAccountId!);
      destDoc = await t.get(destRef);
      if (!destDoc.exists) throw new functions.https.HttpsError('internal', 'Destination account missing');
    } else if (type === 'EXTERNAL_WIRE') {
      // Guard: a wire must never target a Swentra account — that would bypass
      // crediting the recipient and route the funds to the treasury instead.
      const accountNumberToFind = String(recipientDetails?.accountNumber || '').replace(/\s/g, '');
      if (accountNumberToFind) {
        const registryRef = db.collection('accountNumbers').doc(accountNumberToFind);
        const registryDoc = await t.get(registryRef);
        if (registryDoc.exists) {
          throw new functions.https.HttpsError('failed-precondition', "That's a Swentra Vault account — use 'Swentra transfer' so the recipient is credited instantly.");
        }
      }
    }

    // Ledger System Reads
    const revenueId = `system-revenue-${sourceData.currency.toLowerCase()}`;
    const revenueRef = db.collection('users').doc(adminUid).collection('accounts').doc(revenueId);
    const revenueDoc = await t.get(revenueRef);
    
    let masterRef = null;
    let masterDoc = null;
    if (type === 'EXTERNAL_WIRE') {
      const masterId = `system-master-${sourceData.currency.toLowerCase()}`;
      masterRef = db.collection('users').doc(adminUid).collection('accounts').doc(masterId);
      masterDoc = await t.get(masterRef);
    }

    // === ALL READS DONE. START WRITES. === //

    if (destRef && destDoc) {
      const destData = destDoc.data()!;
      const newDestBalance = destData.balance + destinationAmount;
      const newDestAvailable = destData.availableBalance + destinationAmount;
      t.update(destRef, {
        balance: newDestBalance,
        availableBalance: newDestAvailable
      });
    }

    if (fee > 0 && revenueDoc.exists) {
      const revData = revenueDoc.data()!;
      t.update(revenueRef, {
        balance: revData.balance + fee,
        availableBalance: revData.availableBalance + fee,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    if (type === 'EXTERNAL_WIRE' && masterRef && masterDoc && masterDoc.exists) {
      const masterData = masterDoc.data()!;
      t.update(masterRef, {
        balance: masterData.balance + amount, // Amount is principal, so Master takes the liquidity
        availableBalance: masterData.availableBalance + amount,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // Debit source
    t.update(sourceRef, {
      balance: newSourceBalance,
      availableBalance: newSourceAvailable
    });

    const sessionId = "1000042" + Date.now().toString() + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

    // Create Transaction Record for Sender
    const txRef = db.collection(`users/${uid}/transactions`).doc();
    const transactionRecord = {
      id: txRef.id,
      userId: uid,
      type,
      amount: -amount, // Negative for sender (principal)
      fee: fee,
      totalDebit: -totalDebit,
      currency: sourceData.currency,
      sourceAccountId,
      recipientDetails,
      exchangeRate,
      reference: reference || 'Funds Transfer',
      status: type === 'EXTERNAL_WIRE' ? 'PROCESSING' : 'COMPLETED',
      sessionId,
      createdAt: FieldValue.serverTimestamp()
    };
    t.set(txRef, transactionRecord);
    
    // Mark quote as used
    t.update(quoteRef, { status: 'USED', transactionId: txRef.id });

    // Create Transaction Record for Recipient (if internal)
    if ((type === 'SWENTRA_TRANSFER' || type === 'INTERNAL_TRANSFER') && destinationUid) {
      const recipientTxRef = db.collection(`users/${destinationUid}/transactions`).doc();
      recipientTxId = recipientTxRef.id;
      const senderName = (context.auth?.token?.name as string) || (context.auth?.token?.email as string) || 'Swentra Client';
      const senderEmail = (context.auth?.token?.email as string) || '';
      t.set(recipientTxRef, {
        id: recipientTxRef.id,
        userId: destinationUid,
        accountId: destinationAccountId,
        accountNumber: recipientDetails.accountNumber,
        type: 'INCOMING_TRANSFER',
        amount: destinationAmount, // Positive for receiver
        currency: recipientDetails.currency || sourceData.currency,
        sourceDetails: { 
          senderId: uid,
          senderName,
          senderEmail
        },
        reference: reference || 'Incoming Transfer',
        status: 'COMPLETED',
        sessionId,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    return { success: true, transactionId: txRef.id };
  });

  // Post-commit confirmation email. Instant transfers are COMPLETED immediately;
  // EXTERNAL_WIRE stays PROCESSING and is emailed later by
  // completePendingWireTransfers once it reaches COMPLETED.
  if (result.success && transferType !== "EXTERNAL_WIRE") {
    try {
      const userRecord = await getAuth().getUser(uid);
      if (userRecord.email) {
        await sendTransactionConfirmationEmail({
          to: userRecord.email,
          uid,
          transactionId: result.transactionId,
          subject: `Transfer confirmed — ${reference || "Funds Transfer"}`,
        });
      }
    } catch (error) {
      console.error("Error sending transfer confirmation email:", error);
    }

    // Notify the recipient of the incoming transfer.
    if (destUidForNotify && recipientTxId) {
      try {
        const recipient = await getAuth().getUser(destUidForNotify);
        if (recipient.email) {
          await sendIncomingTransferEmail({
            to: recipient.email,
            uid: destUidForNotify,
            transactionId: recipientTxId,
          });
        }
      } catch (error) {
        console.error("Error sending incoming transfer email:", error);
      }
    }
  }

  return result;
});

// Resolve a Swentra Vault account number to its holder + currency. Used by the
// "Swentra transfer" option for payee confirmation and the "New recipient" hint.
export const resolveAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const accountNumber = String(data?.accountNumber || '').replace(/\s/g, '');
  if (!accountNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Account number is required');
  }

  const db = getFirestore();
  const reg = await db.collection('accountNumbers').doc(accountNumber).get();
  if (!reg.exists) return { found: false };

  const assignedTo = reg.data()!.assignedTo as string;
  const currency = reg.data()!.currency as string;

  let holderName = '';
  try {
    const authUser = await getAuth().getUser(assignedTo);
    holderName = authUser.displayName || '';
  } catch {
    /* ignore */
  }
  if (!holderName) {
    try {
      const kyc = await db.collection('users').doc(assignedTo).collection('kyc').doc('submission').get();
      holderName = (kyc.exists && (kyc.data()?.fullName as string)) || '';
    } catch {
      /* ignore */
    }
  }

  return { found: true, currency, holderName: holderName || null };
});