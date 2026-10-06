import * as functions from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;

/**
 * Helper to get the user's document reference
 */
const getUserRef = (uid: string) => {
  return getFirestore().collection('users').doc(uid);
}

/**
 * 1. Setup Transaction PIN
 *
 * Uses set-with-merge so the users/{uid} document is created if it
 * doesn't exist yet (provisionForUser only writes subcollections).
 */
export const setupTransactionPin = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { pin } = data;
  if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 6) {
    throw new functions.https.HttpsError('invalid-argument', 'PIN must be a 4 to 6 digit string.');
  }

  const userRef = getUserRef(context.auth.uid);
  const userDoc = await userRef.get();

  // If the doc already has a PIN, reject the duplicate setup
  if (userDoc.exists && userDoc.data()?.pinHash) {
    throw new functions.https.HttpsError('already-exists', 'Transaction PIN is already set. Use Change PIN instead.');
  }

  // Hash the PIN securely
  const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);

  // Save to Firestore — merge so we create the doc if it doesn't exist
  await userRef.set({
    pinHash,
    failedPinAttempts: 0,
    pinUpdatedAt: new Date().toISOString()
  }, { merge: true });

  return { success: true, message: 'Transaction PIN configured successfully.' };
});

/**
 * 2. Verify Transaction PIN
 */
export const verifyTransactionPin = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { pin } = data;
  if (!pin || typeof pin !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'PIN is required.');
  }

  const userRef = getUserRef(context.auth.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists || !userDoc.data()?.pinHash) {
    throw new functions.https.HttpsError('failed-precondition', 'Transaction PIN has not been set up yet. Please set one up in Security Settings.');
  }

  const userData = userDoc.data()!;

  // Check lockout
  const failedAttempts = userData.failedPinAttempts || 0;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Account temporarily locked due to too many failed PIN attempts. Please contact support.'
    );
  }

  // Compare PIN
  const isValid = await bcrypt.compare(pin, userData.pinHash);

  if (!isValid) {
    // Increment failed attempts
    const newFailedCount = failedAttempts + 1;
    await userRef.set({ failedPinAttempts: newFailedCount }, { merge: true });
    
    throw new functions.https.HttpsError(
      'invalid-argument', 
      `Incorrect PIN. You have ${MAX_FAILED_ATTEMPTS - newFailedCount} attempts remaining.`
    );
  }

  // Reset failed attempts on success
  if (failedAttempts > 0) {
    await userRef.set({ failedPinAttempts: 0 }, { merge: true });
  }

  return { success: true, valid: true };
});

/**
 * 3. Change Transaction PIN
 */
export const changeTransactionPin = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { oldPin, newPin } = data;
  if (!oldPin || !newPin || oldPin.length < 4 || newPin.length < 4) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid PINs provided.');
  }

  const userRef = getUserRef(context.auth.uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists || !userDoc.data()?.pinHash) {
    throw new functions.https.HttpsError(
      'failed-precondition', 
      'No Transaction PIN has been set up yet. Please set one up first in Security Settings.'
    );
  }

  const userData = userDoc.data()!;

  // Check lockout
  const failedAttempts = userData.failedPinAttempts || 0;
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw new functions.https.HttpsError('permission-denied', 'Account locked due to too many failed attempts. Please contact support.');
  }

  // Verify old PIN
  let isOldValid = false;
  try {
    isOldValid = await bcrypt.compare(oldPin, userData.pinHash);
  } catch (error) {
    console.error("bcrypt compare error:", error);
    throw new functions.https.HttpsError('internal', 'Error verifying PIN. Please try again.');
  }

  if (!isOldValid) {
    const newFailedCount = failedAttempts + 1;
    await userRef.set({ failedPinAttempts: newFailedCount }, { merge: true });
    throw new functions.https.HttpsError('invalid-argument', `Incorrect current PIN. You have ${MAX_FAILED_ATTEMPTS - newFailedCount} attempts remaining.`);
  }

  // Set new PIN
  const newPinHash = await bcrypt.hash(newPin, SALT_ROUNDS);
  
  await userRef.set({
    pinHash: newPinHash,
    failedPinAttempts: 0,
    pinUpdatedAt: new Date().toISOString()
  }, { merge: true });

  return { success: true, message: 'Transaction PIN changed successfully.' };
});
