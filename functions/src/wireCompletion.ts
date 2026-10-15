import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { WIRE_COMPLETION_MIN_AGE_MS } from "./config";
import { sendTransactionConfirmationEmail } from "./emails";

/**
 * Complete EXTERNAL_WIRE transactions that have been PROCESSING for at least
 * WIRE_COMPLETION_MIN_AGE_MS. Re-checks each record in a transaction so
 * concurrent runs can't double-complete.
 *
 * Shared by the production scheduled trigger (./wires) and the local-dev cron
 * script (which passes { skipEmail: true }). Lives in its own module so it is
 * NOT re-exported by index.ts — the Firebase CLI must never mistake it for a
 * deployable function.
 */
export async function completePendingWires(
  options?: { skipEmail?: boolean },
): Promise<{ completed: number; emailed: number }> {
  const skipEmail = options?.skipEmail === true;
  const db = getFirestore();
  const cutoffTime = new Date(Date.now() - WIRE_COMPLETION_MIN_AGE_MS);

  const snapshot = await db
    .collectionGroup("transactions")
    .where("type", "==", "EXTERNAL_WIRE")
    .where("status", "==", "PROCESSING")
    .get();

  let completed = 0;
  let emailed = 0;

  for (const doc of snapshot.docs) {
    const tx = doc.data();
    const txRef = doc.ref;
    const uid: string | undefined = tx.userId;
    if (!uid) {
      console.error(`Wire ${doc.id} has no userId; skipping`);
      continue;
    }

    const createdAt = tx.createdAt
      ? typeof tx.createdAt.toDate === "function"
        ? tx.createdAt.toDate()
        : new Date(tx.createdAt)
      : new Date(0);
    if (createdAt > cutoffTime) continue; // too fresh — leave it pending

    try {
      await db.runTransaction(async (t) => {
        const fresh = await t.get(txRef);
        if (!fresh.exists) return;
        const data = fresh.data();
        if (!data || data.status !== "PROCESSING") return;
        t.update(txRef, {
          status: "COMPLETED",
          completedAt: FieldValue.serverTimestamp(),
        });
      });
      completed++;

      if (skipEmail) continue;

      const userRecord = await getAuth().getUser(uid);
      if (userRecord.email) {
        await sendTransactionConfirmationEmail({
          to: userRecord.email,
          uid,
          transactionId: doc.id,
          subject: `Wire completed — ${tx.reference || "Funds Transfer"}`,
        });
        emailed++;
      } else {
        // No email address — stamp it so the run doesn't retry this wire.
        await txRef.update({ emailNotifiedAt: FieldValue.serverTimestamp() });
      }
    } catch (error) {
      console.error(`Error completing wire ${doc.id}:`, error);
    }
  }

  console.log(`Wire completion run: completed=${completed}, emailed=${emailed}`);
  return { completed, emailed };
}