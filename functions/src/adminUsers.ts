import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { ADMIN_BOOTSTRAP_SECRET } from "./config";
import { recordAudit, recordSecurityEvent } from "./audit";

// Admin Bootstrapper
export const bootstrapAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { secretKey } = data;
  if (secretKey !== ADMIN_BOOTSTRAP_SECRET) {
    await recordSecurityEvent({
      action: 'admin.bootstrap_rejected',
      actorUid: context.auth.uid,
      reason: 'Invalid bootstrap secret',
      result: 'denied',
    });
    throw new functions.https.HttpsError('permission-denied', 'Invalid secret key');
  }

  await getAuth().setCustomUserClaims(context.auth.uid, { admin: true });
  
  // Update the user's profile document to reflect admin status
  const db = getFirestore();
  await db.collection('users').doc(context.auth.uid).set({
    role: 'admin',
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  // Provision Treasury Accounts
  const currencies = ["USD", "CHF", "EUR", "GBP"];
  const batch = db.batch();
  for (const cur of currencies) {
    const masterRef = db.collection('users').doc(context.auth.uid).collection('accounts').doc(`system-master-${cur.toLowerCase()}`);
    batch.set(masterRef, {
      id: `system-master-${cur.toLowerCase()}`,
      userId: context.auth.uid,
      accountNumber: `MASTER${cur}`,
      currency: cur,
      type: 'reserve',
      balance: 0,
      availableBalance: 0,
      status: 'active',
      isSystemAccount: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    const revenueRef = db.collection('users').doc(context.auth.uid).collection('accounts').doc(`system-revenue-${cur.toLowerCase()}`);
    batch.set(revenueRef, {
      id: `system-revenue-${cur.toLowerCase()}`,
      userId: context.auth.uid,
      accountNumber: `REVENUE${cur}`,
      currency: cur,
      type: 'current',
      balance: 0,
      availableBalance: 0,
      status: 'active',
      isSystemAccount: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }
  await batch.commit();

  await recordAudit({
    action: 'admin.bootstrap',
    actorUid: context.auth.uid,
    result: 'success',
    description: 'Admin claims granted and treasury accounts provisioned',
  });

  return { success: true, message: 'You are now an admin and treasury accounts have been provisioned. Please sign out and sign back in to refresh your token.' };
});

// Admin List Users
export const adminListUsers = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const db = getFirestore();

  // Aggregate KYC status + account counts in two collection-group reads instead
  // of N+1 per-user reads (this callable backs several admin pages).
  const [listUsersResult, kycSnap, accountsSnap] = await Promise.all([
    getAuth().listUsers(1000),
    db.collectionGroup('kyc').get(),
    db.collectionGroup('accounts').get(),
  ]);

  const kycStatusByUid = new Map<string, string>();
  kycSnap.forEach((doc) => {
    const uid = doc.ref.parent.parent?.id;
    if (uid && doc.id === 'submission') {
      kycStatusByUid.set(uid, doc.data()?.status || 'UNVERIFIED');
    }
  });

  const accountsCountByUid = new Map<string, number>();
  accountsSnap.forEach((doc) => {
    const uid = doc.ref.parent.parent?.id;
    if (uid) accountsCountByUid.set(uid, (accountsCountByUid.get(uid) || 0) + 1);
  });

  const users = listUsersResult.users.map((u) => ({
    uid: u.uid,
    email: u.email,
    creationTime: u.metadata.creationTime,
    lastSignInTime: u.metadata.lastSignInTime,
    disabled: u.disabled,
    admin: !!u.customClaims?.admin,
    kycStatus: kycStatusByUid.get(u.uid) || 'UNVERIFIED',
    accountsCount: accountsCountByUid.get(u.uid) || 0
  }));

  return { users };
});

// Admin Toggle User Status (Enable/Disable Login)
export const adminToggleUserStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { targetUid, disabled } = data;
  if (!targetUid || typeof disabled !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  // Prevent disabling self
  if (targetUid === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'You cannot disable your own admin account.');
  }

  await getAuth().updateUser(targetUid, { disabled });

  await recordAudit({
    action: 'admin.toggle_user_status',
    actorUid: context.auth.uid,
    targetUid,
    description: `User account ${disabled ? 'disabled' : 'enabled'}`,
    result: 'success',
  });

  return { success: true, message: `User account ${disabled ? 'disabled' : 'enabled'}.` };
});

// Admin Toggle Access (Grant or Revoke Admin rights)
export const adminToggleAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { targetUid, isAdmin } = data;
  if (!targetUid || typeof isAdmin !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  if (targetUid === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'You cannot change your own admin status.');
  }

  const user = await getAuth().getUser(targetUid);
  const currentClaims = user.customClaims || {};

  await getAuth().setCustomUserClaims(targetUid, {
    ...currentClaims,
    admin: isAdmin
  });

  await recordAudit({
    action: 'admin.toggle_admin_access',
    actorUid: context.auth.uid,
    targetUid,
    description: `Admin privileges ${isAdmin ? 'granted' : 'revoked'}`,
    result: 'success',
  });

  return { success: true, message: `Admin privileges ${isAdmin ? 'granted' : 'revoked'} for ${user.email}.` };
});

// Admin Reset Transaction PIN (clears a forgotten PIN or a lockout)
export const adminResetPin = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const { targetUid } = data;
  if (!targetUid || typeof targetUid !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const db = getFirestore();
  const userRef = db.collection('users').doc(targetUid);
  await userRef.set(
    {
      pinHash: FieldValue.delete(),
      failedPinAttempts: 0,
      pinLockedUntil: FieldValue.delete(),
      pinUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await recordAudit({
    action: 'admin.pin_reset',
    actorUid: context.auth.uid,
    targetUid,
    result: 'success',
    description: 'Transaction PIN cleared',
  });

  return { success: true, message: 'Transaction PIN cleared. The user must set a new PIN.' };
});