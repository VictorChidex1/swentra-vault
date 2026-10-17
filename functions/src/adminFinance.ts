import * as functions from "firebase-functions/v1";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { recordAudit } from "./audit";

function maskAccount(acct?: string): string {
  const c = (acct || "").replace(/\s/g, "");
  if (!c) return "";
  return c.length <= 4 ? `****${c}` : `****${c.slice(-4)}`;
}

// Admin Process Funding (Deposit/Withdraw)
export const adminProcessFunding = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { targetUid, accountId, amount, type, description } = data;

  if (!targetUid || !accountId || !amount || amount <= 0 || !['DEPOSIT', 'WITHDRAWAL'].includes(type) || !description) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid parameters');
  }

  const db = getFirestore();
  const accountRef = db.collection('users').doc(targetUid).collection('accounts').doc(accountId);
  const transactionsRef = db.collection('users').doc(targetUid).collection('transactions');

  let createdTxId: string | null = null;

  try {
    await db.runTransaction(async (transaction) => {
      const accountDoc = await transaction.get(accountRef);
      if (!accountDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Account not found');
      }

      const accountData = accountDoc.data()!;
      const currentAvailable = accountData.availableBalance || 0;
      const currentLedger = accountData.ledgerBalance || 0;

      if (type === 'WITHDRAWAL' && currentAvailable < amount) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient funds for withdrawal');
      }

      // Calculate new balances
      const balanceChange = type === 'DEPOSIT' ? amount : -amount;
      const newAvailable = currentAvailable + balanceChange;
      const newLedger = currentLedger + balanceChange;

      // Create transaction record
      const newTxRef = transactionsRef.doc();
      createdTxId = newTxRef.id;
      const txData = {
        accountId,
        type,
        amount,
        currency: accountData.currency,
        status: 'COMPLETED',
        description,
        reference: `ADM-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp(),
        metadata: {
          processedBy: context.auth!.uid,
          adminAction: true
        }
      };

      // Apply updates atomically
      transaction.update(accountRef, {
        availableBalance: newAvailable,
        ledgerBalance: newLedger,
        updatedAt: new Date().toISOString()
      });
      
      transaction.set(newTxRef, txData);
    });

    await recordAudit({
      action: 'admin.process_funding',
      actorUid: context.auth.uid,
      targetUid,
      accountId,
      transactionId: createdTxId ?? undefined,
      description: `${type} of ${amount} processed`,
      result: 'success',
    });

    return { success: true, message: `Successfully processed ${type} of ${amount}.` };
  } catch (error: any) {
    console.error("Funding transaction failed:", error);
    throw new functions.https.HttpsError('internal', error.message || 'Transaction failed');
  }
});

// Admin Mint Funds (Inject Liquidity)
export const adminMintFunds = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to perform this action.');
  }

  const authUid = context.auth.uid;
  const { currency, amount } = data;
  if (!currency || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid currency or amount');
  }

  const db = getFirestore();
  const masterId = `system-master-${currency.toLowerCase()}`;
  const masterRef = db.collection('users').doc(authUid).collection('accounts').doc(masterId);

  const result = await db.runTransaction(async (t) => {
    const doc = await t.get(masterRef);
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Master account not found');
    }

    const currentData = doc.data()!;
    const newBalance = currentData.balance + amount;
    
    t.update(masterRef, {
      balance: newBalance,
      availableBalance: newBalance,
      updatedAt: FieldValue.serverTimestamp()
    });

    const txRef = db.collection('users').doc(authUid).collection('transactions').doc();
    t.set(txRef, {
      id: txRef.id,
      userId: authUid,
      type: 'INTERNAL_TRANSFER',
      amount: amount,
      currency,
      sourceAccountId: 'MINT',
      reference: 'Central Bank Liquidity Injection',
      status: 'COMPLETED',
      sessionId: "MINT_" + Date.now().toString(),
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true, newBalance };
  });

  await recordAudit({
    action: 'admin.mint_funds',
    actorUid: authUid,
    accountId: masterId,
    description: `Minted ${amount} ${currency}`,
    result: 'success',
  });

  return result;
});

// Admin Credit Account
export const adminCreditAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to perform this action.');
  }

  const authUid = context.auth.uid;
  const { targetUid, targetAccountId, amount, reference } = data;
  if (!targetUid || !targetAccountId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const db = getFirestore();

  let creditedTxId: string | null = null;

  const result = await db.runTransaction(async (t) => {
    const destRef = db.collection('users').doc(targetUid).collection('accounts').doc(targetAccountId);
    const destDoc = await t.get(destRef);
    if (!destDoc.exists) throw new functions.https.HttpsError('not-found', 'Target account not found');

    const destData = destDoc.data()!;
    const currency = destData.currency;

    const masterId = `system-master-${currency.toLowerCase()}`;
    const masterRef = db.collection('users').doc(authUid).collection('accounts').doc(masterId);
    const masterDoc = await t.get(masterRef);
    if (!masterDoc.exists) throw new functions.https.HttpsError('not-found', 'Master account not found for currency: ' + currency);

    const masterData = masterDoc.data()!;
    if (masterData.availableBalance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient liquidity in master account. Mint funds first.');
    }

    // Debit Master
    t.update(masterRef, {
      balance: masterData.balance - amount,
      availableBalance: masterData.availableBalance - amount,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Credit Target
    t.update(destRef, {
      balance: destData.balance + amount,
      availableBalance: destData.availableBalance + amount,
      updatedAt: FieldValue.serverTimestamp()
    });

    const sessionId = "ADMIN_CREDIT_" + Date.now().toString();

    // Master Tx
    const masterTxRef = db.collection('users').doc(authUid).collection('transactions').doc();
    t.set(masterTxRef, {
      id: masterTxRef.id,
      userId: authUid,
      type: 'EXTERNAL_WIRE',
      amount: -amount,
      currency,
      sourceAccountId: masterId,
      recipientDetails: { fullName: 'User Account ' + destData.accountNumber },
      reference: reference || 'Admin Credit',
      status: 'COMPLETED',
      sessionId,
      createdAt: FieldValue.serverTimestamp()
    });

    // Target Tx
    const targetTxRef = db.collection('users').doc(targetUid).collection('transactions').doc();
    creditedTxId = targetTxRef.id;
    t.set(targetTxRef, {
      id: targetTxRef.id,
      userId: targetUid,
      type: 'INCOMING_TRANSFER',
      amount: amount,
      currency,
      sourceDetails: { senderName: 'Swentra Central' },
      reference: reference || 'Admin Credit',
      status: 'COMPLETED',
      sessionId,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  });

  await recordAudit({
    action: 'admin.credit_account',
    actorUid: authUid,
    targetUid,
    accountId: targetAccountId,
    transactionId: creditedTxId ?? undefined,
    description: `Credited ${amount}`,
    result: 'success',
  });

  return result;
});

// Admin Reverse Transaction — mirrors execution so BOTH sides of the ledger are
// undone: sender refunded (principal + fee), fee reversed from revenue, treasury
// master made whole for wires, and the recipient clawed back for internal
// transfers. Admins must supply a reason; every reversal is recorded in
// auditLogs. No email is sent to the user.
export const adminReverseTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to perform this action.');
  }

  const authUid = context.auth.uid;
  const { targetUid, transactionId, reason } = data;
  if (!targetUid || !transactionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const reversalReason = typeof reason === 'string' ? reason.trim() : '';
  if (reversalReason.length < 3) {
    throw new functions.https.HttpsError('invalid-argument', 'A reversal reason (at least 3 characters) is required.');
  }

  const db = getFirestore();

  let reversalTxId: string | null = null;
  let clawbackUid: string | null = null;
  let revOriginal: Record<string, unknown> = {};

  const result = await db.runTransaction(async (t) => {
    // ---- READS ----
    const txRef = db.collection('users').doc(targetUid).collection('transactions').doc(transactionId);
    const txDoc = await t.get(txRef);
    if (!txDoc.exists) throw new functions.https.HttpsError('not-found', 'Transaction not found');

    const tx = txDoc.data()!;
    if (tx.reversed) throw new functions.https.HttpsError('failed-precondition', 'Transaction already reversed');
    if (tx.amount >= 0) throw new functions.https.HttpsError('failed-precondition', 'Only outgoing transactions can be reversed');
    if (tx.status === 'FAILED') throw new functions.https.HttpsError('failed-precondition', 'Failed transactions cannot be reversed');

    const currency: string = tx.currency;
    const principal = Math.abs(tx.amount ?? 0);
    const fee = tx.fee ?? 0;
    const totalDebit = Math.abs(tx.totalDebit ?? principal + fee);

    // Snapshot of the original transaction, stored on the audit record so the
    // "Recently reversed" view can show amount/recipient with zero extra reads.
    revOriginal = {
      originalTransactionId: transactionId,
      type: tx.type,
      reference: tx.reference,
      amount: principal,
      fee,
      totalDebit,
      currency,
      recipient: tx.recipientDetails
        ? {
            fullName: tx.recipientDetails.fullName ?? null,
            bankName: tx.recipientDetails.bankName ?? null,
            accountNumber: maskAccount(tx.recipientDetails.accountNumber),
          }
        : null,
    };

    const sourceAccountId = tx.sourceAccountId;
    if (!sourceAccountId) throw new functions.https.HttpsError('invalid-argument', 'Transaction has no source account');

    const sourceRef = db.collection('users').doc(targetUid).collection('accounts').doc(sourceAccountId);
    const sourceDoc = await t.get(sourceRef);
    if (!sourceDoc.exists) throw new functions.https.HttpsError('not-found', 'Source account not found');
    const sourceData = sourceDoc.data()!;

    const isInternal = tx.type === 'SWENTRA_TRANSFER' || tx.type === 'INTERNAL_TRANSFER';

    // Fee → revenue account.
    let revenueRef = null;
    let revenueDoc = null;
    if (fee > 0) {
      revenueRef = db.collection('users').doc(authUid).collection('accounts').doc(`system-revenue-${currency.toLowerCase()}`);
      revenueDoc = await t.get(revenueRef);
    }

    // Wire principal → treasury master account.
    let masterRef = null;
    let masterDoc = null;
    if (tx.type === 'EXTERNAL_WIRE') {
      masterRef = db.collection('users').doc(authUid).collection('accounts').doc(`system-master-${currency.toLowerCase()}`);
      masterDoc = await t.get(masterRef);
    }

    // Internal transfer → resolve + read the recipient account to claw back.
    let destRef = null;
    let destDoc = null;
    let received = 0;
    if (isInternal) {
      const accountNumber = String(tx.recipientDetails?.accountNumber || '').replace(/\s/g, '');
      if (!accountNumber) throw new functions.https.HttpsError('failed-precondition', 'Recipient account unknown; cannot reverse safely');

      const registryRef = db.collection('accountNumbers').doc(accountNumber);
      const registryDoc = await t.get(registryRef);
      if (!registryDoc.exists) throw new functions.https.HttpsError('failed-precondition', 'Recipient account not found on Swentra Vault');

      clawbackUid = registryDoc.data()!.assignedTo as string;
      const destAccountId = registryDoc.data()!.accountId as string;
      destRef = db.collection('users').doc(clawbackUid).collection('accounts').doc(destAccountId);
      destDoc = await t.get(destRef);
      if (!destDoc.exists) throw new functions.https.HttpsError('failed-precondition', 'Recipient account missing');

      if (destRef.path === sourceRef.path) {
        throw new functions.https.HttpsError('failed-precondition', 'Self-transfer cannot be reversed automatically');
      }

      received = Math.abs(principal * (tx.exchangeRate ?? 1));
    }

    // ---- WRITES ----
    // 1. Refund the sender (principal + fee).
    t.update(sourceRef, {
      balance: sourceData.balance + totalDebit,
      availableBalance: sourceData.availableBalance + totalDebit,
      updatedAt: FieldValue.serverTimestamp()
    });

    // 2. Reverse the fee from revenue.
    if (revenueRef && revenueDoc && revenueDoc.exists) {
      const revData = revenueDoc.data()!;
      t.update(revenueRef, {
        balance: revData.balance - fee,
        availableBalance: revData.availableBalance - fee,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // 3a. Wire: pull the principal back from the treasury master.
    if (masterRef && masterDoc && masterDoc.exists) {
      const masterData = masterDoc.data()!;
      t.update(masterRef, {
        balance: masterData.balance - principal,
        availableBalance: masterData.availableBalance - principal,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // 3b. Internal: claw the funds back from the recipient.
    if (destRef && destDoc) {
      const destData = destDoc.data()!;
      t.update(destRef, {
        balance: destData.balance - received,
        availableBalance: destData.availableBalance - received,
        updatedAt: FieldValue.serverTimestamp()
      });

      const recipientRevRef = db.collection('users').doc(clawbackUid!).collection('transactions').doc();
      t.set(recipientRevRef, {
        id: recipientRevRef.id,
        userId: clawbackUid,
        type: 'REVERSAL_DEBIT',
        amount: -received,
        currency: tx.recipientDetails?.currency || currency,
        sourceDetails: { senderId: targetUid },
        reference: 'REVERSAL: ' + tx.id,
        status: 'COMPLETED',
        sessionId: 'REV_' + tx.id,
        reversalOf: tx.id,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // 4. Mark the original as reversed.
    t.update(txRef, {
      reversed: true,
      reversedAt: FieldValue.serverTimestamp(),
      reversedBy: authUid,
      reversalReason
    });

    // 5. Sender-side reversal record.
    const revTxRef = db.collection('users').doc(targetUid).collection('transactions').doc();
    reversalTxId = revTxRef.id;
    t.set(revTxRef, {
      id: revTxRef.id,
      userId: targetUid,
      type: 'INCOMING_TRANSFER',
      amount: totalDebit,
      currency,
      sourceDetails: { senderName: 'Reversal' },
      reference: 'REVERSAL: ' + tx.id,
      status: 'COMPLETED',
      sessionId: 'REV_' + tx.id,
      reversalOf: tx.id,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  });

  await recordAudit({
    action: 'admin.reverse_transaction',
    actorUid: authUid,
    targetUid,
    transactionId,
    reason: reversalReason,
    result: 'success',
    description: `Reversed transaction ${transactionId}`,
    details: { reversalTxId, clawbackUid, ...revOriginal },
  });

  return result;
});