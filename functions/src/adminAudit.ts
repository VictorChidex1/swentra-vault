import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

interface ResolvedParty {
  uid: string;
  email: string | null;
  legalName: string | null;
  account?: { number?: string; currency?: string; type?: string } | null;
  external?: boolean;
  fullName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  swiftCode?: string | null;
}

function toIso(v: any): string | null {
  try {
    if (!v) return null;
    if (typeof v.toDate === "function") return v.toDate().toISOString();
    return new Date(v).toISOString();
  } catch {
    return null;
  }
}

async function resolveParty(db: Firestore, uid: string): Promise<ResolvedParty> {
  let email: string | null = null;
  let legalName: string | null = null;

  try {
    email = (await getAuth().getUser(uid)).email || null;
  } catch {
    /* user may be deleted */
  }

  try {
    const kyc = await db.collection("users").doc(uid).collection("kyc").doc("submission").get();
    if (kyc.exists) {
      const d = kyc.data() || {};
      const p = d.personalDetails;
      if (p && (p.firstName || p.lastName)) {
        legalName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || null;
      }
      if (!legalName && d.fullName) legalName = d.fullName;
    }
  } catch {
    /* no KYC */
  }

  return { uid, email, legalName };
}

async function resolveAccount(
  db: Firestore,
  uid: string | null,
  accountId: string | null,
): Promise<{ number?: string; currency?: string; type?: string } | null> {
  if (!uid || !accountId) return null;
  const a = await db.collection("users").doc(uid).collection("accounts").doc(accountId).get();
  if (!a.exists) return null;
  const d = a.data()!;
  return { number: d.accountNumber, currency: d.currency, type: d.type };
}

// Admin-only: resolve a transaction's sender + recipient (legal names from KYC,
// accounts, external bank details) for the admin audit drawer.
export const getAdminTransactionAudit = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Admin only");
  }

  const { targetUid, transactionId } = data || {};
  if (!targetUid || !transactionId) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid parameters");
  }

  const db = getFirestore();
  const txDoc = await db
    .collection("users")
    .doc(targetUid)
    .collection("transactions")
    .doc(transactionId)
    .get();
  if (!txDoc.exists) throw new functions.https.HttpsError("not-found", "Transaction not found");
  const tx = txDoc.data()!;

  const outgoing = (tx.amount ?? 0) < 0;
  const ownerUid: string = targetUid;
  const counterpartyUid: string | null = tx.counterpartyUid || tx.sourceDetails?.senderId || null;

  const ownerParty = await resolveParty(db, ownerUid);
  const ownerAccount = await resolveAccount(db, ownerUid, tx.sourceAccountId || tx.accountId || null);

  let cpParty: ResolvedParty | null = null;
  if (counterpartyUid) cpParty = await resolveParty(db, counterpartyUid);

  let cpAccount: { number?: string; currency?: string; type?: string } | null = null;
  if (outgoing && counterpartyUid && tx.counterpartyTxId) {
    // Sender record → the counterparty is the recipient; their incoming record
    // holds the credited account.
    const cpTx = await db
      .collection("users")
      .doc(counterpartyUid)
      .collection("transactions")
      .doc(tx.counterpartyTxId)
      .get();
    if (cpTx.exists) {
      const c = cpTx.data()!;
      cpAccount =
        (await resolveAccount(db, counterpartyUid, c.accountId || null)) ||
        { number: c.accountNumber, currency: c.currency };
    }
  } else if (!outgoing && counterpartyUid) {
    // Recipient's incoming record → the counterparty is the sender. Find the
    // matching outgoing leg (by counterpartyTxId) to surface the source account.
    const q = await db
      .collection("users")
      .doc(counterpartyUid)
      .collection("transactions")
      .where("counterpartyTxId", "==", transactionId)
      .limit(1)
      .get();
    if (!q.empty) {
      const s = q.docs[0].data();
      cpAccount = await resolveAccount(db, counterpartyUid, s.sourceAccountId || null);
    }
  }

  const ext = !counterpartyUid && tx.recipientDetails ? tx.recipientDetails : null;

  const sender: ResolvedParty | null = outgoing
    ? { ...ownerParty, account: ownerAccount }
    : cpParty
      ? { ...cpParty, account: cpAccount }
      : null;

  const recipient: ResolvedParty | null = outgoing
    ? cpParty
      ? { ...cpParty, account: cpAccount }
      : ext
        ? {
            uid: "",
            email: null,
            legalName: null,
            external: true,
            fullName: ext.fullName ?? null,
            bankName: ext.bankName ?? null,
            accountNumber: ext.accountNumber ?? null,
            swiftCode: ext.swiftCode ?? null,
          }
        : null
    : { ...ownerParty, account: ownerAccount };

  return {
    transaction: {
      id: transactionId,
      type: tx.type,
      status: tx.status,
      amount: tx.amount ?? 0,
      fee: tx.fee ?? 0,
      totalDebit: tx.totalDebit ?? null,
      currency: tx.currency ?? null,
      exchangeRate: tx.exchangeRate ?? null,
      reference: tx.reference ?? null,
      sessionId: tx.sessionId ?? null,
      description: tx.description ?? null,
      createdAt: toIso(tx.createdAt ?? tx.timestamp),
      reversed: !!tx.reversed,
      reversalReason: tx.reversalReason ?? null,
      reversedAt: toIso(tx.reversedAt),
      reversalOfRef: tx.reversalOfRef ?? null,
      originalAmount: tx.originalAmount ?? null,
    },
    sender,
    recipient,
    external: ext,
  };
});