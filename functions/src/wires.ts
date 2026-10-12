import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { WIRE_COMPLETION_MIN_AGE_MS } from "./config";
import { sendTransactionConfirmationEmail } from "./emails";

// Scheduled EXTERNAL_WIRE completion. Runs every 3 minutes (UTC); any wire that
// has been PROCESSING for at least WIRE_COMPLETION_MIN_AGE_MS is flipped to
// COMPLETED and the owner is emailed (guarded by emailNotifiedAt). Existing
// stuck PROCESSING wires from earlier demos are completed too.
export const completePendingWireTransfers = functions.pubsub
  .schedule("every 3 minutes")
  .timeZone("UTC")
  .onRun(async () => {
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
        // Re-check inside a transaction so concurrent runs can't double-complete.
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

    console.log(
      `Wire completion run: completed=${completed}, emailed=${emailed}`,
    );
  });