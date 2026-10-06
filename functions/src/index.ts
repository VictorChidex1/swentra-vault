import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
