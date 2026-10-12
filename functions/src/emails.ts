import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import {
  APP_URL,
  EMAIL_COOLDOWN_MS,
  MAIL_FROM,
  MAIL_REPLY_TO,
  resend,
} from "./config";

export interface EmailContent {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  secureTag?: string;
  footerNote?: string;
}

function buildEmailHtml({
  heading,
  body,
  ctaLabel,
  ctaUrl,
  secureTag = "SECURE REQUEST INITIATED",
  footerNote = "If you did not sign up for Swentra Vault, please ignore this email. Your security is our top priority.",
}: EmailContent): string {
  return `
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

              <h1 style="font-size: 24px; font-weight: 400; color: #ffffff; margin-bottom: 16px; letter-spacing: -0.5px;">${heading}</h1>

              <p style="font-size: 15px; line-height: 1.6; color: #A1A1AA; margin-bottom: 32px;">
                ${body}
              </p>

              <!-- Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 32px;">
                    <a href="${ctaUrl}" style="display: inline-block; background-color: #00E559; color: #000000; font-size: 14px; font-weight: 600; padding: 16px 32px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Manual Link -->
              <p style="font-size: 12px; color: #555555; margin-bottom: 8px;">If the button above does not work, securely copy and paste this link:</p>
              <p style="font-size: 12px; color: #00E559; word-break: break-all; line-height: 1.4; margin-bottom: 40px;">
                ${ctaUrl}
              </p>

              <!-- Divider -->
              <div style="height: 1px; background-color: #222222; margin-bottom: 32px;"></div>

              <!-- Terminal Footer -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: monospace; font-size: 11px; color: #888888; line-height: 1.5;">
                <tr>
                  <td style="color: #00E559;">&gt; ${secureTag}</td>
                </tr>
                <tr>
                  <td style="color: #00E559;">&gt; TIMESTAMP: ${new Date().toISOString()}</td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; color: #A1A1AA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px;">
                    ${footerNote}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}

function buildEmailText({
  heading,
  body,
  ctaUrl,
  footerNote = "If you did not sign up for Swentra Vault, please ignore this email. Your security is our top priority.",
}: EmailContent): string {
  return [heading, "", body, "", ctaUrl, "", footerNote].join("\n");
}

export async function sendAuthEmail({
  to,
  subject,
  content,
}: {
  to: string;
  subject: string;
  content: EmailContent;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: [to],
    replyTo: MAIL_REPLY_TO,
    subject,
    html: buildEmailHtml(content),
    text: buildEmailText(content),
  });
  if (error) {
    // Resend reports failures in the response, not via thrown exceptions.
    console.error("Resend send error:", error);
  }
}

/** SHA-256 hash of a throttle key so no raw email/uid is stored at rest. */
function throttleDocId(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Reserve an email slot in the `emailThrottle` collection atomically.
 * Returns true when the caller may send now; false when still inside the
 * cooldown window (caller should no-op). The slot write happens inside the
 * transaction so concurrent calls cannot both pass the window on one key.
 */
export async function acquireEmailSlot(key: string): Promise<boolean> {
  const db = getFirestore();
  const ref = db.collection("emailThrottle").doc(throttleDocId(key));

  let maySend = false;
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(ref);
    const now = Date.now();

    if (doc.exists) {
      const lastSentAt = doc.data()?.lastSentAt;
      if (lastSentAt && typeof lastSentAt.toMillis === "function") {
        const elapsed = now - lastSentAt.toMillis();
        if (elapsed < EMAIL_COOLDOWN_MS) {
          return; // inside the window — no-op
        }
      }
    }

    transaction.set(
      ref,
      {
        lastSentAt: FieldValue.serverTimestamp(),
        count: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    maySend = true;
  });

  return maySend;
}

/** Rewrite a Firebase action link so the user lands on our app domain. */
export function toAppLink(actionLink: string, path: string): string {
  const urlObj = new URL(actionLink);
  return `${APP_URL}${path}${urlObj.search}`;
}

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function maskAccountNumber(accountNumber: string | undefined): string {
  const cleaned = (accountNumber || "").replace(/\s/g, "");
  if (!cleaned) return "—";
  return cleaned.length <= 4 ? `****${cleaned}` : `****${cleaned.slice(-4)}`;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SWENTRA_TRANSFER: "Swentra transfer",
  INTERNAL_TRANSFER: "Internal transfer",
  EXTERNAL_WIRE: "External wire",
  INCOMING_TRANSFER: "Incoming transfer",
};

const SIMULATION_DISCLAIMER =
  "Swentra Vault is a banking technology prototype and simulated financial environment. Transactions, balances, KYC verification and settlement shown in this demonstration are simulated and do not represent real banking services or regulated financial activity.";

/**
 * Send a confirmation email for a committed transaction record. Reads only the
 * stored (server-authoritative) values, skips when already notified, and stamps
 * `emailNotifiedAt` after sending so a retry cannot double-send.
 */
export async function sendTransactionConfirmationEmail({
  to,
  uid,
  transactionId,
  subject,
}: {
  to: string;
  uid: string;
  transactionId: string;
  subject: string;
}): Promise<void> {
  const db = getFirestore();
  const txRef = db.collection(`users/${uid}/transactions`).doc(transactionId);
  const txDoc = await txRef.get();
  if (!txDoc.exists) return;
  const tx = txDoc.data()!;

  if (tx.emailNotifiedAt) return; // already confirmed — idempotency

  const amount = Math.abs(tx.amount ?? 0);
  const fee = tx.fee ?? 0;
  const totalDebit = Math.abs(tx.totalDebit ?? amount);
  const currency: string = tx.currency || "";
  const statusLabel: string =
    tx.status === "PROCESSING" ? "Processing" : "Completed";
  const reference: string = tx.reference || "Funds Transfer";

  const lines = [
    `Type: ${TRANSACTION_TYPE_LABELS[tx.type] || tx.type || "Transaction"}`,
    `Amount: ${formatMoney(amount, currency)}`,
    ...(fee > 0 ? [`Fee: ${formatMoney(fee, currency)}`] : []),
    `Total debited: ${formatMoney(totalDebit, currency)}`,
    ...(tx.exchangeRate && tx.exchangeRate !== 1
      ? [`Exchange rate: ${tx.exchangeRate}`]
      : []),
    ...(tx.recipientDetails?.fullName
      ? [`Recipient: ${tx.recipientDetails.fullName}`]
      : []),
    ...(tx.recipientDetails?.bankName
      ? [`Recipient bank: ${tx.recipientDetails.bankName}`]
      : []),
    ...(tx.recipientDetails?.accountNumber
      ? [
          `Recipient account: ${maskAccountNumber(
            tx.recipientDetails.accountNumber,
          )}`,
        ]
      : []),
    `Reference: ${reference}`,
    `Status: ${statusLabel}`,
  ];

  await sendAuthEmail({
    to,
    subject,
    content: {
      heading: "Transaction confirmed.",
      body: lines.join("\n"),
      ctaLabel: "View Transactions",
      ctaUrl: `${APP_URL}/app/transactions`,
      secureTag: "TRANSACTION RECORDED",
      footerNote: SIMULATION_DISCLAIMER,
    },
  });

  try {
    await txRef.update({ emailNotifiedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error(`Failed to stamp emailNotifiedAt on ${transactionId}:`, error);
  }
}