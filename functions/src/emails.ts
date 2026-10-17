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

interface TransactionEmailData {
  transactionId: string;
  type: string;
  amount: number;
  fee: number;
  totalDebit: number;
  currency: string;
  status: string;
  reference: string;
  exchangeRate?: number;
  recipientDetails?: {
    fullName?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  createdAt?: unknown;
}

function formatTimestamp(rawDate: unknown): string {
  try {
    if (
      rawDate &&
      typeof (rawDate as { toDate?: () => Date }).toDate === "function"
    ) {
      return (rawDate as { toDate: () => Date }).toDate().toUTCString();
    }
    if (
      rawDate &&
      typeof (rawDate as { toMillis?: () => number }).toMillis === "function"
    ) {
      return new Date(
        (rawDate as { toMillis: () => number }).toMillis(),
      ).toUTCString();
    }
    if (typeof rawDate === "string" || typeof rawDate === "number") {
      return new Date(rawDate).toUTCString();
    }
  } catch {
    // fallback below
  }
  return new Date().toUTCString();
}

function buildTransactionReceiptHtml({
  tx,
  subject,
  ctaUrl,
}: {
  tx: TransactionEmailData;
  subject: string;
  ctaUrl: string;
}): string {
  const isIncoming = tx.type === "INCOMING_TRANSFER";
  const statusLabel = tx.status === "PROCESSING" ? "Processing" : "Completed";
  const isProcessing = tx.status === "PROCESSING";
  const statusColor = isProcessing ? "#EAB308" : "#00E559";
  const statusBg = isProcessing
    ? "rgba(234, 179, 8, 0.1)"
    : "rgba(0, 229, 89, 0.1)";
  const statusBorder = isProcessing
    ? "rgba(234, 179, 8, 0.3)"
    : "rgba(0, 229, 89, 0.3)";

  const heroAmountPrefix = isIncoming ? "+" : "-";
  const heroAmountDisplay = `${heroAmountPrefix} ${formatMoney(
    tx.totalDebit,
    tx.currency,
  )}`;

  const recipientFullName = tx.recipientDetails?.fullName;
  const recipientBank = tx.recipientDetails?.bankName;
  const maskedAcc = maskAccountNumber(tx.recipientDetails?.accountNumber);

  let recipientHero = "";
  if (recipientFullName) {
    recipientHero = recipientFullName;
    if (recipientBank) {
      recipientHero += ` &bull; ${recipientBank}`;
    }
    if (tx.recipientDetails?.accountNumber) {
      recipientHero += ` (${maskedAcc})`;
    }
  } else if (recipientBank) {
    recipientHero = `${recipientBank} (${maskedAcc})`;
  } else if (!isIncoming) {
    recipientHero = "External Account";
  }

  const rows: Array<{ label: string; value: string; isMono?: boolean }> = [
    {
      label: "Transfer Type",
      value: TRANSACTION_TYPE_LABELS[tx.type] || tx.type || "Transaction",
    },
    {
      label: "Status",
      value: statusLabel,
    },
    {
      label: "Reference",
      value: tx.reference || "Funds Transfer",
    },
  ];

  if (tx.exchangeRate && tx.exchangeRate !== 1) {
    rows.push({
      label: "Exchange Rate",
      value: String(tx.exchangeRate),
      isMono: true,
    });
  }

  if (recipientFullName) {
    rows.push({
      label: "Beneficiary Name",
      value: recipientFullName,
    });
  }

  if (recipientBank) {
    rows.push({
      label: "Beneficiary Bank",
      value: recipientBank,
    });
  }

  if (tx.recipientDetails?.accountNumber) {
    rows.push({
      label: "Account Number",
      value: maskedAcc,
      isMono: true,
    });
  }

  if (tx.recipientDetails?.swiftCode) {
    rows.push({
      label: "SWIFT / BIC",
      value: tx.recipientDetails.swiftCode,
      isMono: true,
    });
  }

  if (tx.recipientDetails?.routingNumber) {
    rows.push({
      label: "Routing Number",
      value: tx.recipientDetails.routingNumber,
      isMono: true,
    });
  }

  rows.push({
    label: "Transaction ID",
    value: tx.transactionId,
    isMono: true,
  });

  const tableRowsHtml = rows
    .map(
      (row) => `
      <tr>
        <td valign="top" style="padding: 12px 0; border-bottom: 1px solid #1F1F23; font-size: 13px; color: #8E8E93; line-height: 1.4;" width="42%">
          ${row.label}
        </td>
        <td align="right" valign="top" style="padding: 12px 0; border-bottom: 1px solid #1F1F23; font-size: 13px; color: #FFFFFF; font-family: ${
          row.isMono
            ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }; font-weight: 600; line-height: 1.4; word-break: break-word;" width="58%">
          ${row.value}
        </td>
      </tr>`,
    )
    .join("");

  const formattedTimestamp = formatTimestamp(tx.createdAt);

  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>${subject}</title>
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
          body { background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
          table { border-spacing: 0; border-collapse: collapse; width: 100%; }
          td { padding: 0; }
          a { text-decoration: none; }
        </style>
      </head>
      <body style="background-color: #000000; padding: 40px 16px; margin: 0;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #0A0A0A; border: 1px solid #222222; border-radius: 8px; overflow: hidden;">
          <!-- Top Security Bar -->
          <tr>
            <td style="background-color: #050505; border-bottom: 1px solid #222222; padding: 12px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #888888; letter-spacing: 1.5px; text-transform: uppercase;">
                    SWENTRA VAULT &bull; DISPATCH
                  </td>
                  <td align="right" valign="middle" style="white-space: nowrap; width: 1%;">
                    <span style="display: inline-block; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: ${statusColor}; letter-spacing: 0.5px; background-color: ${statusBg}; border: 1px solid ${statusBorder}; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
                      &#9679;&nbsp;${statusLabel.toUpperCase()}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 24px;">
              <!-- Logo -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <img src="${APP_URL}/assets/swentra-vault-logo-256.png" alt="Swentra Vault" width="44" height="44" style="display: block; border: 0;" />
                  </td>
                </tr>
              </table>

              <!-- Heading & Subtitle -->
              <h1 style="font-size: 24px; font-weight: 500; color: #FFFFFF; margin-bottom: 8px; letter-spacing: -0.5px;">
                Transaction confirmed.
              </h1>
              <p style="font-size: 14px; line-height: 1.5; color: #A1A1AA; margin-bottom: 28px;">
                Funds have been successfully settled and recorded on the Swentra settlement ledger.
              </p>

              <!-- HERO DEBIT CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #111113; border: 1px solid #27272A; border-radius: 8px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #71717A; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 8px;">
                          ${isIncoming ? "TOTAL CREDITED TO VAULT" : "TOTAL DEBITED FROM VAULT"}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; padding-bottom: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                          ${heroAmountDisplay}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #71717A; padding-bottom: ${recipientHero ? "14px" : "0"};">
                          ${
                            tx.fee > 0
                              ? `Transfer amount: ${formatMoney(
                                  tx.amount,
                                  tx.currency,
                                )} &bull; Network fee: ${formatMoney(
                                  tx.fee,
                                  tx.currency,
                                )}`
                              : "Zero network fees incurred &bull; Instant settlement"
                          }
                        </td>
                      </tr>
                      ${
                        recipientHero
                          ? `
                      <tr>
                        <td style="border-top: 1px solid #1F1F23; padding-top: 14px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="20" valign="middle" style="color: #00E559; font-size: 14px; line-height: 1;">
                                &#8594;
                              </td>
                              <td style="font-size: 13px; color: #E4E4E7; font-weight: 500;">
                                ${recipientHero}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>`
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- STRUCTURED LEDGER CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #111113; border: 1px solid #27272A; border-radius: 8px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td colspan="2" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: #00E559; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 14px; border-bottom: 1px solid #27272A;">
                          TRANSACTION BREAKDOWN &amp; AUDIT DATA
                        </td>
                      </tr>
                      ${tableRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PRIMARY CTA BUTTON -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <a href="${ctaUrl}" style="display: inline-block; background-color: #00E559; color: #000000 !important; font-size: 13px; font-weight: 700; padding: 14px 28px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none;">
                      <span style="color: #000000 !important; font-weight: 700;">View in Vault</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- MANUAL LINK -->
              <p style="font-size: 12px; color: #555555; margin-bottom: 6px;">Direct link to your transaction ledger:</p>
              <p style="font-size: 12px; color: #00E559; word-break: break-all; line-height: 1.4; margin-bottom: 28px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                ${ctaUrl}
              </p>

              <!-- DIVIDER -->
              <div style="height: 1px; background-color: #222222; margin-bottom: 24px;"></div>

              <!-- TERMINAL AUDIT BOX -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #070709; border: 1px solid #1F1F23; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.6;">
                    <div style="color: #00E559; font-weight: 600;">&gt; CRYPTOGRAPHIC RECEIPT</div>
                    <div style="color: #FFFFFF; font-size: 11px; word-break: break-all; margin-bottom: 10px;">${tx.transactionId}</div>
                    <div style="color: #00E559; font-weight: 600;">&gt; SETTLEMENT TIMESTAMP</div>
                    <div style="color: #A1A1AA; font-size: 11px; margin-bottom: 10px;">${formattedTimestamp}</div>
                    <div style="color: #555555; font-size: 10px;">&gt; PROTOCOL: SWENTRA-VAULT-SETTLEMENT-V1</div>
                  </td>
                </tr>
              </table>

              <!-- REGULATORY DISCLAIMER -->
              <p style="font-size: 11px; line-height: 1.5; color: #52525B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${SIMULATION_DISCLAIMER}
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}

function buildTransactionReceiptText({
  tx,
  ctaUrl,
}: {
  tx: TransactionEmailData;
  ctaUrl: string;
}): string {
  const isIncoming = tx.type === "INCOMING_TRANSFER";
  const statusLabel = tx.status === "PROCESSING" ? "Processing" : "Completed";
  const heroAmountPrefix = isIncoming ? "+" : "-";
  const formattedTimestamp = formatTimestamp(tx.createdAt);

  const textLines = [
    "SWENTRA VAULT • CRYPTOGRAPHIC TRANSACTION DISPATCH",
    `Status: ${statusLabel.toUpperCase()}`,
    "==================================================",
    "",
    `${
      isIncoming ? "TOTAL CREDITED" : "TOTAL DEBITED"
    }: ${heroAmountPrefix} ${formatMoney(tx.totalDebit, tx.currency)}`,
    `Transfer Amount: ${formatMoney(tx.amount, tx.currency)}`,
    ...(tx.fee > 0 ? [`Network Fee: ${formatMoney(tx.fee, tx.currency)}`] : []),
    "",
    "TRANSACTION BREAKDOWN:",
    `- Type: ${TRANSACTION_TYPE_LABELS[tx.type] || tx.type || "Transaction"}`,
    `- Status: ${statusLabel}`,
    `- Reference: ${tx.reference || "Funds Transfer"}`,
    ...(tx.exchangeRate && tx.exchangeRate !== 1
      ? [`- Exchange Rate: ${tx.exchangeRate}`]
      : []),
    ...(tx.recipientDetails?.fullName
      ? [`- Beneficiary Name: ${tx.recipientDetails.fullName}`]
      : []),
    ...(tx.recipientDetails?.bankName
      ? [`- Beneficiary Bank: ${tx.recipientDetails.bankName}`]
      : []),
    ...(tx.recipientDetails?.accountNumber
      ? [
          `- Account Number: ${maskAccountNumber(
            tx.recipientDetails.accountNumber,
          )}`,
        ]
      : []),
    ...(tx.recipientDetails?.swiftCode
      ? [`- SWIFT / BIC: ${tx.recipientDetails.swiftCode}`]
      : []),
    `- Transaction ID: ${tx.transactionId}`,
    "",
    `View in Vault: ${ctaUrl}`,
    "",
    "==================================================",
    `> CRYPTOGRAPHIC RECEIPT: ${tx.transactionId}`,
    `> SETTLEMENT TIMESTAMP: ${formattedTimestamp}`,
    "",
    SIMULATION_DISCLAIMER,
  ];

  return textLines.join("\n");
}

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
  const currency: string = tx.currency || "USD";
  const status: string = tx.status || "COMPLETED";
  const reference: string = tx.reference || "Funds Transfer";

  const txData: TransactionEmailData = {
    transactionId,
    type: tx.type || "EXTERNAL_WIRE",
    amount,
    fee,
    totalDebit,
    currency,
    status,
    reference,
    exchangeRate: tx.exchangeRate,
    recipientDetails: tx.recipientDetails,
    createdAt: tx.createdAt,
  };

  const ctaUrl = `${APP_URL}/app/transactions`;

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: [to],
    replyTo: MAIL_REPLY_TO,
    subject,
    html: buildTransactionReceiptHtml({ tx: txData, subject, ctaUrl }),
    text: buildTransactionReceiptText({ tx: txData, ctaUrl }),
  });

  if (error) {
    console.error("Resend send error for transaction email:", error);
  }

  try {
    await txRef.update({ emailNotifiedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error(`Failed to stamp emailNotifiedAt on ${transactionId}:`, error);
  }
}

/**
 * Notify the recipient of an incoming internal transfer. Reads the recipient's
 * INCOMING_TRANSFER record (server-authoritative), sends via Resend, and stamps
 * `emailNotifiedAt` so a retry cannot double-send.
 */
export async function sendIncomingTransferEmail({
  to,
  uid,
  transactionId,
}: {
  to: string;
  uid: string;
  transactionId: string;
}): Promise<void> {
  const db = getFirestore();
  const txRef = db.collection(`users/${uid}/transactions`).doc(transactionId);
  const txDoc = await txRef.get();
  if (!txDoc.exists) return;
  const tx = txDoc.data()!;
  if (tx.emailNotifiedAt) return;

  const amount = Math.abs(tx.amount ?? 0);
  const currency: string = tx.currency || "";
  const reference: string = tx.reference || "Incoming Transfer";
  const statusLabel = tx.status === "PROCESSING" ? "Processing" : "Completed";

  await sendAuthEmail({
    to,
    subject: `You received ${formatMoney(amount, currency)}`,
    content: {
      heading: "You received a transfer.",
      body: [
        `Amount received: ${formatMoney(amount, currency)}`,
        `Reference: ${reference}`,
        `Status: ${statusLabel}`,
      ].join("\n"),
      ctaLabel: "View Transactions",
      ctaUrl: `${APP_URL}/app/transactions`,
      secureTag: "FUNDS RECEIVED",
      footerNote: SIMULATION_DISCLAIMER,
    },
  });

  try {
    await txRef.update({ emailNotifiedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error(`Failed to stamp incoming email on ${transactionId}:`, error);
  }
}