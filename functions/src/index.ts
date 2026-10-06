import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
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
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: monospace; font-size: 11px; color: #555555; line-height: 1.5;">
                <tr>
                  <td>&gt; SECURE REQUEST INITIATED</td>
                </tr>
                <tr>
                  <td>&gt; TIMESTAMP: ${new Date().toISOString()}</td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; color: #444444;">
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
