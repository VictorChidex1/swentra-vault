import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Audit / security-event records per `context.md` §43-44.
 *
 * `auditLogs` captures administrative and financial mutations.
 * `securityEvents` captures authentication/fraud signals (PIN failures,
 * rejected privileged actions).
 *
 * Never store passwords, transaction PINs, tokens, private keys, or full
 * card/PIN data in either collection.
 */
export interface AuditEvent {
  action: string;
  actorUid?: string;
  targetUid?: string;
  accountId?: string;
  transactionId?: string;
  description?: string;
  reason?: string;
  result?: string;
  details?: Record<string, unknown>;
}

async function writeEvent(
  collectionName: "auditLogs" | "securityEvents",
  event: AuditEvent,
): Promise<void> {
  const db = getFirestore();

  const doc: Record<string, unknown> = {
    action: event.action,
    occurredAt: FieldValue.serverTimestamp(),
    actorUid: event.actorUid ?? null,
  };

  if (event.targetUid !== undefined) doc.targetUid = event.targetUid;
  if (event.accountId !== undefined) doc.accountId = event.accountId;
  if (event.transactionId !== undefined) doc.transactionId = event.transactionId;
  if (event.description !== undefined) doc.description = event.description;
  if (event.reason !== undefined) doc.reason = event.reason;
  if (event.result !== undefined) doc.result = event.result;
  if (event.details !== undefined) doc.details = event.details;

  await db.collection(collectionName).add(doc);
}

/** Record an administrative or financial mutation. */
export async function recordAudit(event: AuditEvent): Promise<void> {
  await writeEvent("auditLogs", event);
}

/** Record a security-significant event (PIN failures, rejected actions…). */
export async function recordSecurityEvent(event: AuditEvent): Promise<void> {
  await writeEvent("securityEvents", event);
}