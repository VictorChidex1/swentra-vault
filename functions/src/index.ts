import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { Resend } from "resend";

admin.initializeApp();

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const APP_URL = "https://swentra-vault.vercel.app";

export const sendPremiumVerificationEmail = functions.auth
  .user()
  .onCreate(async (user) => {
    if (!user.email) return;

    try {
      const firebaseLink = await getAuth().generateEmailVerificationLink(
        user.email,
        {
          url: `${APP_URL}/app`, // Where the user goes AFTER verifying
        },
      );

      const urlObj = new URL(firebaseLink);
      const customVerificationLink = `${APP_URL}/verify-email${urlObj.search}`;

      const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Reset styles for email clients */
          body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
          body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
          table { border-spacing: 0; border-collapse: collapse; width: 100%; }
          td { padding: 0; }
          a { text-decoration: none; }
        </style>
      </head>
      <body style="background-color: #000000; padding: 40px 20px;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #222222; border-radius: 8px; overflow: hidden;">
          <!-- Top Security Bar -->
          <tr>
            <td style="background-color: #050505; border-bottom: 1px solid #222222; padding: 12px 40px;">
              <table width="100%">
                <tr>
                  <td style="font-family: monospace; font-size: 10px; color: #555555; letter-spacing: 1px;">
                    SWENTRA VAULT SECURITY
                  </td>
                  <td align="right" style="font-family: monospace; font-size: 10px; color: #00E559; letter-spacing: 1px;">
                    ENCRYPTED
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <!-- Logo -->
              <img src="${APP_URL}/assets/swentra-vault-logo-256.png" alt="Swentra Vault" width="48" style="display: block; margin-bottom: 32px;" />
              
              <h1 style="font-size: 24px; font-weight: 400; color: #ffffff; margin-bottom: 16px; letter-spacing: -0.5px;">Welcome to Swentra Vault.</h1>
              
              <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 32px;">
                You are one step away from unlocking your secure financial hub. To finalize your account setup and protect your assets, please confirm your email address below.
              </p>
              
              <!-- Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 32px;">
                    <a href="${customVerificationLink}" style="display: inline-block; background-color: #00E559; color: #000000; font-size: 14px; font-weight: 600; padding: 16px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                      Activate My Vault
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Manual Link -->
              <p style="font-size: 12px; color: #555555; margin-bottom: 8px;">If the button above does not work, securely copy and paste this link:</p>
              <p style="font-size: 12px; color: #00E559; word-break: break-all; line-height: 1.4; margin-bottom: 40px;">
                ${customVerificationLink}
              </p>

              <!-- Divider -->
              <div style="height: 1px; background-color: #222222; margin-bottom: 32px;"></div>

              <!-- Terminal Footer -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: monospace; font-size: 11px; color: #888888; line-height: 1.5;">
                <tr>
                  <td style="color: #00E559;">&gt; SECURE REQUEST INITIATED</td>
                </tr>
                <tr>
                  <td style="color: #00E559;">&gt; TIMESTAMP: ${new Date().toISOString()}</td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; color: #A1A1AA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px;">
                    If you did not sign up for Swentra Vault, please ignore this email. Your security is our top priority.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

      await resend.emails.send({
        // Once I buy swentravault.com and verify it in Resend, change this to: 'Swentra Vault <noreply@swentravault.com>'
        from: "Swentra Vault <onboarding@resend.dev>",
        to: [user.email],
        subject: "Verify your Swentra Vault account",
        html: htmlTemplate,
      });

      console.log(
        `Successfully sent premium verification email to ${user.email}`,
      );
    } catch (error) {
      console.error("Error sending premium verification email:", error);
    }
  });

function generate12DigitNumber(): string {
  let result = '';
  for (let i = 0; i < 12; i++) {
    // First digit shouldn't be 0
    const min = i === 0 ? 1 : 0;
    result += Math.floor(Math.random() * (10 - min) + min).toString();
  }
  return result;
}

async function provisionForUser(uid: string) {
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

  return { success: true, message: `User KYC ${status.toLowerCase()}` };
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
      const txData = {
        accountId,
        type,
        amount,
        currency: accountData.currency,
        status: 'COMPLETED',
        description,
        reference: `ADM-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
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

    return { success: true, message: `Successfully processed ${type} of ${amount}.` };
  } catch (error: any) {
    console.error("Funding transaction failed:", error);
    throw new functions.https.HttpsError('internal', error.message || 'Transaction failed');
  }
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

  return { success: true, message: 'System configuration updated successfully.' };
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

// 2. Manual HTTP trigger to migrate OLD users
export const runMigration = functions.https.onRequest(async (_req, res) => {
  try {
    const listUsersResult = await getAuth().listUsers();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const userRecord of listUsersResult.users) {
      const provisioned = await provisionForUser(userRecord.uid);
      if (provisioned) {
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    res.status(200).send(`Migration Complete! Migrated ${migratedCount} users. Skipped ${skippedCount} users (already had accounts).`);
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).send("Migration failed. Check Firebase console logs.");
  }
});

export const getTransferQuote = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const { sourceAccountId, destinationCurrency, amount, type } = data;
  const uid = context.auth.uid;
  const db = getFirestore();

  if (amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive');

  // 1. Get source currency
  const sourceRef = db.collection(`users/${uid}/accounts`).doc(sourceAccountId);
  const sourceDoc = await sourceRef.get();
  if (!sourceDoc.exists) throw new functions.https.HttpsError('not-found', 'Source account not found');
  
  const sourceCurrency = sourceDoc.data()!.currency;

  // 2. Fetch live FX if needed
  let rawRate = 1.0;
  if (sourceCurrency !== destinationCurrency) {
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${sourceCurrency}&to=${destinationCurrency}`);
      if (!response.ok) throw new Error('FX API failed');
      const fxData: any = await response.json();
      rawRate = fxData.rates[destinationCurrency];
    } catch (error) {
      throw new functions.https.HttpsError('unavailable', 'Exchange rate service is currently down');
    }
  }

  // 3. Apply Bank Spread (1.5%)
  // If converting, bank gives slightly less destination currency per source currency
  const exchangeRate = sourceCurrency === destinationCurrency ? 1.0 : rawRate * 0.985;

  // 4. Calculate Fee
  let fee = 0;
  if (type === 'EXTERNAL_WIRE') {
    fee = 15.00; // Flat $15 or equivalent fee for wires
  } else if (type === 'SWENTRA_TRANSFER') {
    fee = 0.00; // Free for Swentra users
  } else if (type === 'INTERNAL_TRANSFER') {
    fee = 0.00; // Free for own accounts
  }

  const totalDebit = amount + fee;
  const convertedAmount = amount * exchangeRate;

  // 5. Store Quote
  const quoteRef = db.collection('transferQuotes').doc();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

  await quoteRef.set({
    userId: uid,
    sourceAccountId,
    sourceCurrency,
    destinationCurrency,
    principalAmount: amount,
    fee,
    totalDebit,
    exchangeRate,
    convertedAmount,
    type,
    expiresAt: Timestamp.fromDate(expiresAt),
    status: 'ACTIVE',
    createdAt: FieldValue.serverTimestamp()
  });

  return {
    quoteId: quoteRef.id,
    sourceCurrency,
    destinationCurrency,
    principalAmount: amount,
    fee,
    totalDebit,
    exchangeRate,
    convertedAmount,
    expiresAt: expiresAt.toISOString()
  };
});

export const executeTransfer = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  
  const { quoteId, recipientDetails, reference } = data;
  const uid = context.auth.uid;
  const db = getFirestore();

  if (!quoteId) throw new functions.https.HttpsError('invalid-argument', 'Missing quote ID');

  const adminQuery = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  if (adminQuery.empty) throw new functions.https.HttpsError('internal', 'Treasury uninitialized');
  const adminUid = adminQuery.docs[0].id;

  return await db.runTransaction(async (t) => {
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
        throw new functions.https.HttpsError('not-found', 'Recipient account not found on Swentra Vault');
      }

      destinationUid = registryDoc.data()!.assignedTo;
      destinationAccountId = registryDoc.data()!.accountId;

      destRef = db.collection(`users/${destinationUid}/accounts`).doc(destinationAccountId!);
      destDoc = await t.get(destRef);
      if (!destDoc.exists) throw new functions.https.HttpsError('internal', 'Destination account missing');
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
      t.set(recipientTxRef, {
        id: recipientTxRef.id,
        userId: destinationUid,
        type: 'INCOMING_TRANSFER',
        amount: destinationAmount, // Positive for receiver
        currency: recipientDetails.currency || sourceData.currency,
        sourceDetails: { senderId: uid },
        reference: reference || 'Incoming Transfer',
        status: 'COMPLETED',
        sessionId,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    return { success: true, transactionId: txRef.id };
  });
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

  return await db.runTransaction(async (t) => {
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

  return await db.runTransaction(async (t) => {
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
});

// Admin Reverse Transaction
export const adminReverseTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Must be an admin to perform this action.');
  }

  const authUid = context.auth.uid;
  const { targetUid, transactionId } = data;
  if (!targetUid || !transactionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid parameters');
  }

  const db = getFirestore();

  return await db.runTransaction(async (t) => {
    const txRef = db.collection('users').doc(targetUid).collection('transactions').doc(transactionId);
    const txDoc = await t.get(txRef);
    if (!txDoc.exists) throw new functions.https.HttpsError('not-found', 'Transaction not found');
    
    const tx = txDoc.data()!;
    if (tx.reversed) throw new functions.https.HttpsError('failed-precondition', 'Already reversed');

    if (tx.amount >= 0) {
       throw new functions.https.HttpsError('unimplemented', 'Reversing incoming transfers not supported yet');
    }

    const sourceAccountId = tx.sourceAccountId;
    if (!sourceAccountId) throw new functions.https.HttpsError('invalid-argument', 'Transaction has no source account');

    const sourceRef = db.collection('users').doc(targetUid).collection('accounts').doc(sourceAccountId);
    const sourceDoc = await t.get(sourceRef);
    if (!sourceDoc.exists) throw new functions.https.HttpsError('not-found', 'Source account not found');

    const sourceData = sourceDoc.data()!;
    const refundAmount = Math.abs(tx.totalDebit || tx.amount);

    t.update(sourceRef, {
      balance: sourceData.balance + refundAmount,
      availableBalance: sourceData.availableBalance + refundAmount,
      updatedAt: FieldValue.serverTimestamp()
    });

    const masterId = `system-master-${tx.currency.toLowerCase()}`;
    const masterRef = db.collection('users').doc(authUid).collection('accounts').doc(masterId);
    const masterDoc = await t.get(masterRef);
    
    if (masterDoc.exists) {
      const masterData = masterDoc.data()!;
      t.update(masterRef, {
        balance: masterData.balance - refundAmount,
        availableBalance: masterData.availableBalance - refundAmount,
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // Mark original as reversed
    t.update(txRef, { reversed: true, reversedAt: FieldValue.serverTimestamp() });

    // Create reversal tx
    const revTxRef = db.collection('users').doc(targetUid).collection('transactions').doc();
    t.set(revTxRef, {
      id: revTxRef.id,
      userId: targetUid,
      type: 'INCOMING_TRANSFER',
      amount: refundAmount,
      currency: tx.currency,
      sourceDetails: { senderName: 'Reversal' },
      reference: 'REVERSAL: ' + tx.id,
      status: 'COMPLETED',
      sessionId: "REV_" + tx.id,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  });
});

export * from './pin';
