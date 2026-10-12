import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { recordAudit } from "./audit";

// Admin Dashboard Stats
export const adminGetDashboardStats = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const db = getFirestore();
  
  // 1. Total Users
  const listUsersResult = await getAuth().listUsers(1000);
  const totalUsers = listUsersResult.users.length;

  // 2. Pending KYC
  const kycQuery = db.collectionGroup('kyc').where('status', '==', 'UNDER_REVIEW');
  const kycSnap = await kycQuery.count().get();
  const pendingKycCount = kycSnap.data().count;

  // 3. Total Accounts
  const accountsQuery = db.collectionGroup('accounts');
  const accountsSnap = await accountsQuery.count().get();
  const totalAccounts = accountsSnap.data().count;

  // 4. Total Transactions (Optional/Future proofing)
  const txQuery = db.collectionGroup('transactions');
  const txSnap = await txQuery.count().get();
  const totalTransactions = txSnap.data().count;

  // 5. Recent Activity Mock Data (Will fetch real data in the future)
  // For now, let's grab the 5 most recent users as activity
  const recentUsers = listUsersResult.users
    .sort((a, b) => new Date(b.metadata.creationTime).getTime() - new Date(a.metadata.creationTime).getTime())
    .slice(0, 5)
    .map(u => ({
      id: u.uid,
      type: 'user_signup',
      title: 'New User Registration',
      description: `${u.email} joined Swentra Vault.`,
      timestamp: u.metadata.creationTime
    }));

  return {
    totalUsers,
    pendingKycCount,
    totalAccounts,
    totalTransactions,
    recentActivity: recentUsers
  };
});

// Get System Config
export const adminGetSystemConfig = functions.https.onCall(async (_data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const db = getFirestore();
  const configDoc = await db.collection('system').doc('config').get();
  
  if (!configDoc.exists) {
    // Return default config if none exists
    return {
      fxMarginPercent: 2.0,
      wireTransferFee: 15.0,
      swentraTransferFee: 0.0,
      transfersEnabled: true,
      maintenanceMode: false
    };
  }

  return configDoc.data();
});

// Update System Config
export const adminUpdateSystemConfig = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const db = getFirestore();
  const configRef = db.collection('system').doc('config');

  await configRef.set({
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: context.auth.uid
  }, { merge: true });

  await recordAudit({
    action: 'admin.system_config_update',
    actorUid: context.auth.uid,
    result: 'success',
    description: 'System configuration updated',
  });

  return { success: true, message: 'System configuration updated successfully.' };
});