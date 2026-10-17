import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
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
  beneficiaryName?: string;
  balance?: number;
  availableBalance?: number;
  balanceCurrency?: string;
  recipientDetails?: {
    fullName?: string;
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  createdAt?: unknown;
}

function toDate(rawDate: unknown): Date {
  try {
    if (
      rawDate &&
      typeof (rawDate as { toDate?: () => Date }).toDate === "function"
    ) {
      return (rawDate as { toDate: () => Date }).toDate();
    }
    if (
      rawDate &&
      typeof (rawDate as { toMillis?: () => number }).toMillis === "function"
    ) {
      return new Date((rawDate as { toMillis: () => number }).toMillis());
    }
    if (typeof rawDate === "string" || typeof rawDate === "number") {
      return new Date(rawDate);
    }
  } catch {
    // fallback below
  }
  return new Date();
}

// Transaction times are always rendered in Swiss time (Europe/Zurich), the
// Vault's operating timezone.
function formatTimestamp(rawDate: unknown): string {
  const date = toDate(rawDate);
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Zurich",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toUTCString();
  }
}

/**
 * Resolve a user's legal full name from their KYC submission
 * (personalDetails.firstName + lastName — the same name shown in Settings),
 * falling back to the Auth display name.
 */
async function resolveLegalName(uid: string | undefined): Promise<string | null> {
  if (!uid) return null;
  try {
    const db = getFirestore();
    const kyc = await db
      .collection("users")
      .doc(uid)
      .collection("kyc")
      .doc("submission")
      .get();
    const p = kyc.exists ? kyc.data()?.personalDetails : null;
    if (p && (p.firstName || p.lastName)) {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
      if (name) return name;
    }
  } catch {
    /* ignore — fall through to Auth */
  }
  try {
    const user = await getAuth().getUser(uid);
    return user.displayName || null;
  } catch {
    return null;
  }
}

/** Read the current + available balance of a user's account. */
async function resolveBalances(
  uid: string | undefined,
  accountId: string | undefined,
): Promise<{ balance: number; availableBalance: number; currency?: string } | null> {
  if (!uid || !accountId) return null;
  try {
    const db = getFirestore();
    const acct = await db
      .collection("users")
      .doc(uid)
      .collection("accounts")
      .doc(accountId)
      .get();
    if (!acct.exists) return null;
    const d = acct.data()!;
    return {
      balance: typeof d.balance === "number" ? d.balance : 0,
      availableBalance:
        typeof d.availableBalance === "number" ? d.availableBalance : 0,
      currency: typeof d.currency === "string" ? d.currency : undefined,
    };
  } catch {
    return null;
  }
}

/** For an internal transfer, resolve the beneficiary's user id. */
async function resolveBeneficiaryUid(tx: {
  counterpartyUid?: string;
  recipientDetails?: { accountNumber?: string };
}): Promise<string | null> {
  if (tx.counterpartyUid) return tx.counterpartyUid;
  const acctNum = String(tx.recipientDetails?.accountNumber || "").replace(/\s/g, "");
  if (!acctNum) return null;
  try {
    const db = getFirestore();
    const reg = await db.collection("accountNumbers").doc(acctNum).get();
    return reg.exists ? ((reg.data()?.assignedTo as string) || null) : null;
  } catch {
    return null;
  }
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

  const recipientFullName = tx.beneficiaryName || tx.recipientDetails?.fullName;
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
    {
      label: "Date & Time",
      value: formatTimestamp(tx.createdAt),
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

  if (typeof tx.balance === "number") {
    rows.push({
      label: "Current Balance",
      value: formatMoney(tx.balance, tx.balanceCurrency || tx.currency),
      isMono: true,
    });
  }

  if (typeof tx.availableBalance === "number") {
    rows.push({
      label: "Available Balance",
      value: formatMoney(tx.availableBalance, tx.balanceCurrency || tx.currency),
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
        <td valign="top" style="padding: 12px 0; border-bottom: 1px solid #232932; font-size: 13px; color: #D4D4D8 !important; line-height: 1.4;" width="42%">
          <span style="color: #D4D4D8 !important; font-size: 13px; font-weight: 500; font-family: Roboto, Helvetica, Arial, sans-serif; display: inline-block;">
            ${row.label}
          </span>
        </td>
        <td align="right" valign="top" style="padding: 12px 0; border-bottom: 1px solid #232932; font-size: 13px; color: #FFFFFF !important; line-height: 1.4; word-break: break-word;" width="58%">
          <span style="color: #FFFFFF !important; font-size: 13px; font-weight: 600; font-family: ${
            row.isMono
              ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              : 'Roboto, Helvetica, Arial, sans-serif'
          }; display: inline-block; word-break: break-word;">
            ${row.value}
          </span>
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
                  <td valign="middle" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #D4D4D8 !important; letter-spacing: 1.5px; text-transform: uppercase;">
                    <span style="color: #D4D4D8 !important;">SWENTRA VAULT &bull; DEBIT DISPATCH</span>
                  </td>
                  <td align="right" valign="middle" style="white-space: nowrap; width: 1%;">
                    <span style="display: inline-block; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: ${statusColor} !important; letter-spacing: 0.5px; background-color: ${statusBg}; border: 1px solid ${statusBorder}; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
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
              <!-- Obsidian Shield Logo Container -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #000000; border: 1px solid #27272A; border-radius: 12px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                      <img src="${APP_URL}/assets/swentra-vault-logo-256.png" alt="Swentra Vault" width="44" height="44" style="display: block; border: 0; border-radius: 8px;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading & Subtitle -->
              <h1 style="font-size: 24px; font-weight: 500; color: #FFFFFF !important; margin-bottom: 8px; letter-spacing: -0.5px;">
                <span style="color: #FFFFFF !important;">Transaction confirmed.</span>
              </h1>
              <p style="font-size: 14px; line-height: 1.5; color: #D4D4D8 !important; margin-bottom: 28px;">
                <span style="color: #D4D4D8 !important;">Funds have been successfully settled and recorded on the Swentra settlement ledger.</span>
              </p>

              <!-- HERO DEBIT CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #121417; border: 1px solid #2A323D; border-radius: 8px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #00E559 !important; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 8px;">
                          <span style="color: #00E559 !important; font-weight: 700;">${isIncoming ? "TOTAL CREDITED TO VAULT" : "TOTAL DEBITED FROM VAULT"}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 32px; font-weight: 700; color: #FFFFFF !important; letter-spacing: -0.5px; padding-bottom: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                          <span style="color: #FFFFFF !important; font-weight: 700;">${heroAmountDisplay}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #A1A1AA !important; padding-bottom: ${recipientHero ? "14px" : "0"};">
                          <span style="color: #A1A1AA !important;">
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
                          </span>
                        </td>
                      </tr>
                      ${
                        recipientHero
                          ? `
                      <tr>
                        <td style="border-top: 1px solid #232932; padding-top: 14px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="20" valign="middle" style="color: #00E559 !important; font-size: 14px; line-height: 1;">
                                <span style="color: #00E559 !important;">&#8594;</span>
                              </td>
                              <td style="font-size: 13px; color: #E4E4E7 !important; font-weight: 500;">
                                <span style="color: #E4E4E7 !important;">Beneficiary: <strong style="color: #FFFFFF !important;">${recipientHero}</strong></span>
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
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #121417; border: 1px solid #2A323D; border-radius: 8px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td colspan="2" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; color: #00E559 !important; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 14px; border-bottom: 1px solid #2A323D;">
                          <span style="color: #00E559 !important;">TRANSACTION BREAKDOWN &amp; AUDIT DATA</span>
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
                      <span style="color: #000000 !important; font-weight: 700;">View in Vault Ledger &rarr;</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- MANUAL LINK -->
              <p style="font-size: 12px; color: #71717A; margin-bottom: 6px;">Direct link to your transaction ledger:</p>
              <p style="font-size: 12px; color: #00E559; word-break: break-all; line-height: 1.4; margin-bottom: 28px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                ${ctaUrl}
              </p>

              <!-- DIVIDER -->
              <div style="height: 1px; background-color: #222222; margin-bottom: 24px;"></div>

              <!-- TERMINAL AUDIT BOX -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #070709; border: 1px solid #2A323D; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.6;">
                    <div style="color: #00E559 !important; font-weight: 600;"><span style="color: #00E559 !important;">&gt; CRYPTOGRAPHIC RECEIPT</span></div>
                    <div style="color: #FFFFFF !important; font-size: 11px; word-break: break-all; margin-bottom: 10px;"><span style="color: #FFFFFF !important;">${tx.transactionId}</span></div>
                    <div style="color: #00E559 !important; font-weight: 600;"><span style="color: #00E559 !important;">&gt; SETTLEMENT TIMESTAMP</span></div>
                    <div style="color: #D4D4D8 !important; font-size: 11px; margin-bottom: 10px;"><span style="color: #D4D4D8 !important;">${formattedTimestamp}</span></div>
                    <div style="color: #71717A !important; font-size: 10px;"><span style="color: #71717A !important;">&gt; PROTOCOL: SWENTRA-VAULT-SETTLEMENT-V1 &bull; VERIFIED</span></div>
                  </td>
                </tr>
              </table>

              <!-- FRAUD WARNING & SECURITY NOTICE -->
              <p style="font-size: 12px; line-height: 1.5; color: #D4D4D8; margin-bottom: 16px;">
                <strong style="color: #FFFFFF;">Security Reminder:</strong> Swentra Vault will never ask for your password, PIN, or cryptographic recovery keys via email.
              </p>

              <!-- REGULATORY DISCLAIMER -->
              <p style="font-size: 11px; line-height: 1.5; color: #71717A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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
    `- Date & Time: ${formattedTimestamp}`,
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
    ...(typeof tx.balance === "number"
      ? [`- Current Balance: ${formatMoney(tx.balance, tx.balanceCurrency || tx.currency)}`]
      : []),
    ...(typeof tx.availableBalance === "number"
      ? [`- Available Balance: ${formatMoney(tx.availableBalance, tx.balanceCurrency || tx.currency)}`]
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

  // Beneficiary legal name: internal transfers resolve the counterparty's KYC
  // name; external wires use the beneficiary name entered at transfer time.
  const isInternal =
    tx.type === "SWENTRA_TRANSFER" || tx.type === "INTERNAL_TRANSFER";
  let beneficiaryName: string | undefined;
  if (isInternal) {
    const beneficiaryUid = await resolveBeneficiaryUid(tx);
    beneficiaryName =
      (await resolveLegalName(beneficiaryUid || undefined)) ||
      tx.recipientDetails?.fullName ||
      undefined;
  } else {
    beneficiaryName = tx.recipientDetails?.fullName || undefined;
  }

  const balances = await resolveBalances(uid, tx.sourceAccountId);

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
    beneficiaryName,
    balance: balances?.balance,
    availableBalance: balances?.availableBalance,
    balanceCurrency: balances?.currency,
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

interface IncomingTransferEmailData {
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  senderName: string;
  recipientAccount: string;
  balance?: number;
  availableBalance?: number;
  balanceCurrency?: string;
  createdAt?: unknown;
}

function buildIncomingTransferReceiptHtml({
  tx,
  subject,
  ctaUrl,
}: {
  tx: IncomingTransferEmailData;
  subject: string;
  ctaUrl: string;
}): string {
  const statusLabel = tx.status === "PROCESSING" ? "Processing" : "Completed";
  const isProcessing = tx.status === "PROCESSING";
  const statusColor = isProcessing ? "#EAB308" : "#00E559";
  const statusBg = isProcessing
    ? "rgba(234, 179, 8, 0.1)"
    : "rgba(0, 229, 89, 0.1)";
  const statusBorder = isProcessing
    ? "rgba(234, 179, 8, 0.3)"
    : "rgba(0, 229, 89, 0.3)";

  const formattedAmount = `+ ${formatMoney(tx.amount, tx.currency)}`;
  const formattedTimestamp = formatTimestamp(tx.createdAt);

  const rows: Array<{ label: string; value: string; isMono?: boolean }> = [
    {
      label: "Transfer Type",
      value: "Incoming Swentra Transfer",
    },
    {
      label: "Settlement Status",
      value: `${statusLabel} (Immediate Availability)`,
    },
    {
      label: "Originating Sender",
      value: tx.senderName,
    },
    {
      label: "Payment Reference",
      value: tx.reference || "Funds Transfer",
    },
    {
      label: "Date & Time",
      value: formatTimestamp(tx.createdAt),
    },
    {
      label: "Amount Credited",
      value: formattedAmount,
      isMono: true,
    },
    {
      label: "Credited Account",
      value: tx.recipientAccount,
      isMono: true,
    },
    ...(typeof tx.balance === "number"
      ? [
          {
            label: "Current Balance",
            value: formatMoney(tx.balance, tx.balanceCurrency || tx.currency),
            isMono: true,
          },
        ]
      : []),
    ...(typeof tx.availableBalance === "number"
      ? [
          {
            label: "Available Balance",
            value: formatMoney(
              tx.availableBalance,
              tx.balanceCurrency || tx.currency,
            ),
            isMono: true,
          },
        ]
      : []),
    {
      label: "Clearing Protocol",
      value: "Swentra Internal Clearing (SIC)",
    },
    {
      label: "Transaction ID",
      value: tx.transactionId,
      isMono: true,
    },
  ];

  const tableRowsHtml = rows
    .map(
      (row) => `
      <tr>
        <td valign="top" style="padding: 12px 0; border-bottom: 1px solid #232932; font-size: 13px; color: #D4D4D8 !important; line-height: 1.4;" width="42%">
          <span style="color: #D4D4D8 !important; font-size: 13px; font-weight: 500; font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; display: inline-block;">
            ${row.label}
          </span>
        </td>
        <td align="right" valign="top" style="padding: 12px 0; border-bottom: 1px solid #232932; font-size: 13px; color: #FFFFFF !important; line-height: 1.4; word-break: break-word;" width="58%">
          <span style="color: #FFFFFF !important; font-size: 13px; font-weight: 600; font-family: ${
            row.isMono
              ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              : 'Roboto, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Helvetica, Arial, sans-serif'
          }; display: inline-block; word-break: break-word;">
            ${row.value}
          </span>
        </td>
      </tr>`,
    )
    .join("");

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
                  <td valign="middle" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #D4D4D8 !important; letter-spacing: 1.5px; text-transform: uppercase;">
                    <span style="color: #D4D4D8 !important;">SWENTRA VAULT &bull; TRANSFER NOTIFICATION</span>
                  </td>
                  <td align="right" valign="middle" style="white-space: nowrap; width: 1%;">
                    <span style="display: inline-block; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; font-weight: 700; color: ${statusColor} !important; letter-spacing: 0.5px; background-color: ${statusBg}; border: 1px solid ${statusBorder}; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
                      &#9679;&nbsp;FUNDS SETTLED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 24px;">
              <!-- Obsidian Shield Logo Container -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #000000; border: 1px solid #27272A; border-radius: 12px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                      <img src="${APP_URL}/assets/swentra-vault-logo-256.png" alt="Swentra Vault" width="44" height="44" style="display: block; border: 0; border-radius: 8px;" />
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading & Subtitle -->
              <h1 style="font-size: 24px; font-weight: 500; color: #FFFFFF !important; margin-bottom: 8px; letter-spacing: -0.5px;">
                <span style="color: #FFFFFF !important;">Funds successfully credited.</span>
              </h1>
              <p style="font-size: 14px; line-height: 1.5; color: #D4D4D8 !important; margin-bottom: 28px;">
                <span style="color: #D4D4D8 !important;">You have received an incoming transfer. The full amount has been settled and is immediately available in your account balance.</span>
              </p>

              <!-- HERO CREDIT CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #121417; border: 1px solid #2A323D; border-radius: 8px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #00E559 !important; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 8px;">
                          <span style="color: #00E559 !important; font-weight: 700;">TOTAL CREDITED TO VAULT</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 32px; font-weight: 700; color: #FFFFFF !important; letter-spacing: -0.5px; padding-bottom: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                          <span style="color: #FFFFFF !important; font-weight: 700;">${formattedAmount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 12px; color: #A1A1AA !important; padding-bottom: 14px;">
                          <span style="color: #A1A1AA !important;">Instant Swiss Clearing &bull; Zero Network Fees &bull; Available Immediately</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top: 1px solid #232932; padding-top: 14px;">
                          <table width="100%" border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="20" valign="middle" style="color: #00E559 !important; font-size: 14px; line-height: 1;">
                                <span style="color: #00E559 !important;">&#8595;</span>
                              </td>
                              <td style="font-size: 13px; color: #E4E4E7 !important; font-weight: 500;">
                                <span style="color: #E4E4E7 !important;">Credited to: <strong style="color: #FFFFFF !important;">${tx.recipientAccount}</strong></span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- STRUCTURED LEDGER CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #121417; border: 1px solid #2A323D; border-radius: 8px; margin-bottom: 28px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td colspan="2" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 700; color: #00E559 !important; letter-spacing: 1.5px; text-transform: uppercase; padding-bottom: 14px; border-bottom: 1px solid #2A323D;">
                          <span style="color: #00E559 !important;">SETTLEMENT BREAKDOWN &amp; TRANSACTION DATA</span>
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
                      <span style="color: #000000 !important; font-weight: 700;">View in Vault Ledger &rarr;</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- MANUAL LINK -->
              <p style="font-size: 12px; color: #71717A; margin-bottom: 6px;">Direct link to your transaction ledger:</p>
              <p style="font-size: 12px; color: #00E559; word-break: break-all; line-height: 1.4; margin-bottom: 28px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                ${ctaUrl}
              </p>

              <!-- DIVIDER -->
              <div style="height: 1px; background-color: #222222; margin-bottom: 24px;"></div>

              <!-- TERMINAL AUDIT BOX -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #070709; border: 1px solid #2A323D; border-radius: 6px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.6;">
                    <div style="color: #00E559 !important; font-weight: 600;"><span style="color: #00E559 !important;">&gt; CRYPTOGRAPHIC RECEIPT</span></div>
                    <div style="color: #FFFFFF !important; font-size: 11px; word-break: break-all; margin-bottom: 10px;"><span style="color: #FFFFFF !important;">${tx.transactionId}</span></div>
                    <div style="color: #00E559 !important; font-weight: 600;"><span style="color: #00E559 !important;">&gt; SETTLEMENT TIMESTAMP</span></div>
                    <div style="color: #D4D4D8 !important; font-size: 11px; margin-bottom: 10px;"><span style="color: #D4D4D8 !important;">${formattedTimestamp}</span></div>
                    <div style="color: #71717A !important; font-size: 10px;"><span style="color: #71717A !important;">&gt; PROTOCOL: SWENTRA-VAULT-CLEARING-V1 &bull; VERIFIED</span></div>
                  </td>
                </tr>
              </table>

              <!-- FRAUD WARNING & SECURITY NOTICE -->
              <p style="font-size: 12px; line-height: 1.5; color: #D4D4D8; margin-bottom: 16px;">
                <strong style="color: #FFFFFF;">Security Reminder:</strong> Swentra Vault will never ask for your password, PIN, or cryptographic recovery keys via email.
              </p>

              <!-- REGULATORY DISCLAIMER -->
              <p style="font-size: 11px; line-height: 1.5; color: #71717A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                ${SIMULATION_DISCLAIMER}
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
}

function buildIncomingTransferReceiptText({
  tx,
  ctaUrl,
}: {
  tx: IncomingTransferEmailData;
  ctaUrl: string;
}): string {
  const formattedTimestamp = formatTimestamp(tx.createdAt);
  const textLines = [
    "SWENTRA VAULT • TRANSFER NOTIFICATION",
    "Status: FUNDS SETTLED",
    "==================================================",
    "",
    `TOTAL CREDITED: + ${formatMoney(tx.amount, tx.currency)}`,
    "Instant Swiss Clearing • Zero Network Fees • Available Immediately",
    "",
    "SETTLEMENT BREAKDOWN & TRANSACTION DATA:",
    `- Transfer Type: Incoming Swentra Transfer`,
    `- Settlement Status: Completed (Immediate Availability)`,
    `- Originating Sender: ${tx.senderName}`,
    `- Payment Reference: ${tx.reference || "Funds Transfer"}`,
    `- Date & Time: ${formattedTimestamp}`,
    `- Credited Account: ${tx.recipientAccount}`,
    ...(typeof tx.balance === "number"
      ? [`- Current Balance: ${formatMoney(tx.balance, tx.balanceCurrency || tx.currency)}`]
      : []),
    ...(typeof tx.availableBalance === "number"
      ? [`- Available Balance: ${formatMoney(tx.availableBalance, tx.balanceCurrency || tx.currency)}`]
      : []),
    `- Clearing Protocol: Swentra Internal Clearing (SIC)`,
    `- Transaction ID: ${tx.transactionId}`,
    "",
    `View in Vault Ledger: ${ctaUrl}`,
    "",
    "==================================================",
    `> CRYPTOGRAPHIC RECEIPT: ${tx.transactionId}`,
    `> SETTLEMENT TIMESTAMP: ${formattedTimestamp}`,
    `> PROTOCOL: SWENTRA-VAULT-CLEARING-V1 • VERIFIED`,
    "",
    "Security Reminder: Swentra Vault will never ask for your password, PIN, or cryptographic recovery keys via email.",
    "",
    SIMULATION_DISCLAIMER,
  ];

  return textLines.join("\n");
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
  const currency: string = tx.currency || "CHF";
  const reference: string = tx.reference || "Incoming Transfer";
  const status: string = tx.status || "COMPLETED";

  const senderLegalName = await resolveLegalName(tx.sourceDetails?.senderId);
  let senderName = senderLegalName || tx.sourceDetails?.senderName;
  if (!senderName && tx.sourceDetails?.senderId) {
    try {
      const senderUser = await getAuth().getUser(tx.sourceDetails.senderId);
      senderName = senderUser.displayName || senderUser.email || "Swentra Client";
    } catch {
      senderName = "Swentra Client";
    }
  }
  if (!senderName) {
    senderName = "Swentra Vault Client";
  }

  const balances = await resolveBalances(uid, tx.accountId);

  const recipientAccount = tx.accountNumber
    ? maskAccountNumber(tx.accountNumber)
    : "Private Vault Liquidity";

  const ctaUrl = `${APP_URL}/app/transactions`;
  const subject = `Transfer Received: +${formatMoney(amount, currency)} credited to your vault`;

  const txData: IncomingTransferEmailData = {
    transactionId,
    amount,
    currency,
    status,
    reference,
    senderName,
    recipientAccount,
    balance: balances?.balance,
    availableBalance: balances?.availableBalance,
    balanceCurrency: balances?.currency,
    createdAt: tx.createdAt,
  };

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: [to],
    replyTo: MAIL_REPLY_TO,
    subject,
    html: buildIncomingTransferReceiptHtml({ tx: txData, subject, ctaUrl }),
    text: buildIncomingTransferReceiptText({ tx: txData, ctaUrl }),
  });

  if (error) {
    console.error("Resend send error for incoming transfer email:", error);
  }

  try {
    await txRef.update({ emailNotifiedAt: FieldValue.serverTimestamp() });
  } catch (error) {
    console.error(`Failed to stamp incoming email on ${transactionId}:`, error);
  }
}