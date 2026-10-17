import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Resolve a user's legal full name from their KYC submission
 * (personalDetails.firstName + lastName — the same name shown in Settings),
 * falling back to the Firebase Auth display name.
 *
 * Single source of truth for "who is this user, by their legal name" — used by
 * the transfer writer (so recipients see the sender's real name), the payee
 * resolver, and the transaction emails.
 */
export async function resolveLegalName(
  uid: string | undefined,
): Promise<string | null> {
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
