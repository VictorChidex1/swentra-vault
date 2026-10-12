import * as functions from "firebase-functions/v1";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function generate12DigitNumber(): string {
  let result = '';
  for (let i = 0; i < 12; i++) {
    // First digit shouldn't be 0
    const min = i === 0 ? 1 : 0;
    result += Math.floor(Math.random() * (10 - min) + min).toString();
  }
  return result;
}

export async function provisionForUser(uid: string) {
  const db = getFirestore();
  const currencies: ("CHF" | "USD" | "EUR" | "NGN")[] = ["CHF", "USD", "EUR", "NGN"];
  
  // Check if they already have accounts
  const existing = await db.collection(`users/${uid}/accounts`).limit(1).get();
  if (!existing.empty) {
    return false; // Already provisioned
  }

  for (const currency of currencies) {
    let success = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!success && attempts < maxAttempts) {
      attempts++;
      const candidateNumber = generate12DigitNumber();
      
      try {
        await db.runTransaction(async (transaction) => {
          const registryRef = db.collection('accountNumbers').doc(candidateNumber);
          const registryDoc = await transaction.get(registryRef);
          
          if (registryDoc.exists) {
            throw new Error('COLLISION');
          }
          
          const accountRef = db.collection(`users/${uid}/accounts`).doc();
          
          transaction.set(registryRef, {
            assignedTo: uid,
            currency: currency,
            accountId: accountRef.id,
            createdAt: FieldValue.serverTimestamp(),
          });
          
          transaction.set(accountRef, {
            id: accountRef.id,
            ownerId: uid,
            accountNumber: candidateNumber,
            currency,
            type: currency === "CHF" ? "current" : "reserve",
            balance: 0,
            availableBalance: 0,
            status: "active",
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        
        success = true;
      } catch (error: any) {
        if (error.message !== 'COLLISION') throw error;
      }
    }
    
    if (!success) {
      console.error(`Failed to generate unique account number for ${currency} (User: ${uid})`);
    }
  }
  
  return true; // Successfully provisioned
}

// 1. Automatic trigger for NEW signups
export const provisionAccounts = functions.auth.user().onCreate(async (user) => {
  await provisionForUser(user.uid);
  console.log(`Successfully provisioned 4 high-entropy currency accounts for new user ${user.uid}`);
});