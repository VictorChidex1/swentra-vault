import * as functions from "firebase-functions/v1";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { recordAudit } from "./audit";

// Admin Review KYC
export const adminReviewKyc = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to perform this action.');
  }

  const { targetUid, status, rejectionReason } = data;
  if (!targetUid || !status || !['VERIFIED', 'REJECTED'].includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const db = getFirestore();
  const kycRef = db.collection('users').doc(targetUid).collection('kyc').doc('submission');
  
  // Verify document exists
  const doc = await kycRef.get();
  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'KYC record not found');
  }

  await kycRef.update({
    status: status,
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: context.auth.uid,
    rejectionReason: rejectionReason || null
  });

  await recordAudit({
    action: 'admin.kyc_review',
    actorUid: context.auth.uid,
    targetUid,
    result: status.toLowerCase(),
    reason: rejectionReason || undefined,
    description: `KYC set to ${status}`,
  });

  return { success: true, message: `User KYC ${status.toLowerCase()}` };
});