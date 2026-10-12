import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Admin Bootstrapper
export const bootstrapAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { secretKey } = data;
  if (secretKey !== 'SwentraAdmin2026') {
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

  return { success: true, message: 'You are now an admin and treasury accounts have been provisioned. Please sign out and sign back in to refresh your token.' };
});

// Admin List Users
export const adminListUsers = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const listUsersResult = await getAuth().listUsers(1000);
  const db = getFirestore();

  const users = await Promise.all(listUsersResult.users.map(async (u) => {
    const kycDoc = await db.collection('users').doc(u.uid).collection('kyc').doc('submission').get();
    const kycStatus = kycDoc.exists ? kycDoc.data()?.status : 'UNVERIFIED';

    // Fetch accounts to get total balance (optional but useful)
    const accountsSnap = await db.collection('users').doc(u.uid).collection('accounts').get();
    const accountsCount = accountsSnap.size;

    return {
      uid: u.uid,
      email: u.email,
      creationTime: u.metadata.creationTime,
      lastSignInTime: u.metadata.lastSignInTime,
      disabled: u.disabled,
      admin: !!u.customClaims?.admin,
      kycStatus,
      accountsCount
    };
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

  return { success: true, message: `Admin privileges ${isAdmin ? 'granted' : 'revoked'} for ${user.email}.` };
});