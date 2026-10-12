import * as functions from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import * as bcrypt from 'bcryptjs';
import { recordAudit, recordSecurityEvent } from './audit';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 3;
const PIN_LOCKOUT_MS = 15 * 60 * 1000;

interface PinLockoutState {
  locked: boolean;
  remainingMs: number;
}

function getLockoutState(userData: any): PinLockoutState {
  const lockedUntil = userData.pinLockedUntil
    ? new Date(userData.pinLockedUntil).getTime()
    : 0;
  const remainingMs = lockedUntil - Date.now();
  return { locked: remainingMs > 0, remainingMs: Math.max(0, remainingMs) };
}

function lockoutMessage(state: PinLockoutState): string {
  const minutes = Math.max(1, Math.ceil(state.remainingMs / 60000));
  return `Account temporarily locked. Try again in about ${minutes} minute(s).`;
}

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

  await recordAudit({
    action: 'pin.setup',
    actorUid: context.auth.uid,
    result: 'success',
  });

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

  // Lockout check (pinLockedUntil persists across restarts).
  const failedAttempts = userData.failedPinAttempts || 0;
  const lockoutState = getLockoutState(userData);
  if (lockoutState.locked) {
    throw new functions.https.HttpsError('permission-denied', lockoutMessage(lockoutState));
  }
  // An expired lockout resets the attempt counter on next use.
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    await userRef.set({ failedPinAttempts: 0, pinLockedUntil: null }, { merge: true });
  }

  // Compare PIN
  const isValid = await bcrypt.compare(pin, userData.pinHash);

  if (!isValid) {
    // Increment failed attempts; lock once the ceiling is reached.
    const newFailedCount = failedAttempts + 1;
    const update: Record<string, unknown> = { failedPinAttempts: newFailedCount };
    if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
      update.pinLockedUntil = new Date(Date.now() + PIN_LOCKOUT_MS).toISOString();
    }
    await userRef.set(update, { merge: true });

    await recordSecurityEvent({
      action: 'pin.verify_failed',
      actorUid: context.auth.uid,
      description: `Incorrect PIN (${newFailedCount}/${MAX_FAILED_ATTEMPTS})`,
      result: 'denied',
    });

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedCount;
    if (attemptsRemaining <= 0) {
      throw new functions.https.HttpsError(
        'permission-denied',
        lockoutMessage({ locked: true, remainingMs: PIN_LOCKOUT_MS }),
      );
    }
    throw new functions.https.HttpsError(
      'invalid-argument', 
      `Incorrect PIN. You have ${attemptsRemaining} attempts remaining.`
    );
  }

  // Reset failed attempts on success
  if (failedAttempts > 0 || userData.pinLockedUntil) {
    await userRef.set({ failedPinAttempts: 0, pinLockedUntil: null }, { merge: true });
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

  // Lockout check (pinLockedUntil persists across restarts).
  const failedAttempts = userData.failedPinAttempts || 0;
  const lockoutState = getLockoutState(userData);
  if (lockoutState.locked) {
    throw new functions.https.HttpsError('permission-denied', lockoutMessage(lockoutState));
  }
  // An expired lockout resets the attempt counter on next use.
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    await userRef.set({ failedPinAttempts: 0, pinLockedUntil: null }, { merge: true });
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
    const update: Record<string, unknown> = { failedPinAttempts: newFailedCount };
    if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
      update.pinLockedUntil = new Date(Date.now() + PIN_LOCKOUT_MS).toISOString();
    }
    await userRef.set(update, { merge: true });

    await recordSecurityEvent({
      action: 'pin.change_failed',
      actorUid: context.auth.uid,
      description: `Incorrect current PIN (${newFailedCount}/${MAX_FAILED_ATTEMPTS})`,
      result: 'denied',
    });

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedCount;
    if (attemptsRemaining <= 0) {
      throw new functions.https.HttpsError(
        'permission-denied',
        lockoutMessage({ locked: true, remainingMs: PIN_LOCKOUT_MS }),
      );
    }
    throw new functions.https.HttpsError('invalid-argument', `Incorrect current PIN. You have ${attemptsRemaining} attempts remaining.`);
  }

  // Set new PIN
  const newPinHash = await bcrypt.hash(newPin, SALT_ROUNDS);
  
  await userRef.set({
    pinHash: newPinHash,
    failedPinAttempts: 0,
    pinLockedUntil: null,
    pinUpdatedAt: new Date().toISOString()
  }, { merge: true });

  await recordAudit({
    action: 'pin.changed',
    actorUid: context.auth.uid,
    result: 'success',
  });

  return { success: true, message: 'Transaction PIN changed successfully.' };
});
