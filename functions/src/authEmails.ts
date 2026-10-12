import * as functions from "firebase-functions/v1";
import { getAuth } from "firebase-admin/auth";
import { APP_URL } from "./config";
import { acquireEmailSlot, sendAuthEmail, toAppLink } from "./emails";

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

      await sendAuthEmail({
        to: user.email,
        subject: "Verify your Swentra Vault account",
        content: {
          heading: "Welcome to Swentra Vault.",
          body: "You are one step away from unlocking your secure financial hub. To finalize your account setup and protect your assets, please confirm your email address below.",
          ctaLabel: "Activate My Vault",
          ctaUrl: toAppLink(firebaseLink, "/verify-email"),
        },
      });

      console.log(
        `Successfully sent premium verification email to ${user.email}`,
      );
    } catch (error) {
      console.error("Error sending premium verification email:", error);
    }
  });

// Resend the verification email from the verify-email screen.
export const resendVerificationEmail = functions.https.onCall(
  async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
    }

    const uid = context.auth.uid;

    // Cooldown guard so a session cannot flood one inbox.
    if (!(await acquireEmailSlot(`verify:${uid}`))) {
      return { ok: true };
    }

    try {
      const userRecord = await getAuth().getUser(uid);
      if (userRecord.emailVerified || !userRecord.email) {
        return { ok: true };
      }

      const firebaseLink = await getAuth().generateEmailVerificationLink(
        userRecord.email,
        { url: `${APP_URL}/app` },
      );

      await sendAuthEmail({
        to: userRecord.email,
        subject: "Verify your Swentra Vault account",
        content: {
          heading: "Verify your Swentra Vault account.",
          body: "Your secure financial hub is almost ready. Please confirm your email address below to activate your account.",
          ctaLabel: "Verify My Email",
          ctaUrl: toAppLink(firebaseLink, "/verify-email"),
          secureTag: "VERIFICATION REQUESTED",
        },
      });
    } catch (error) {
      // Never surface account state through this endpoint.
      console.error("Error resending verification email:", error);
    }

    return { ok: true };
  },
);

// Password reset link sent via Resend. Unauthenticated by design (the user is
// locked out), so it returns a generic success for every input to avoid
// account enumeration, and the cooldown caps how often any address is mailed.
export const requestPasswordResetEmail = functions.https.onCall(async (data) => {
  const email =
    typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!email) {
    throw new functions.https.HttpsError("invalid-argument", "Email is required");
  }

  // Reserve a slot BEFORE any lookups so known and unknown addresses are
  // indistinguishable (identical response and timing for a reused address).
  if (!(await acquireEmailSlot(`reset:${email}`))) {
    return { ok: true };
  }

  try {
    const firebaseLink = await getAuth().generatePasswordResetLink(email, {
      url: `${APP_URL}/reset-password`,
    });

    await sendAuthEmail({
      to: email,
      subject: "Reset your Swentra Vault password",
      content: {
        heading: "Reset your password.",
        body: "We received a request to reset the password on your Swentra Vault account. Use the button below to choose a new one. If you did not make this request, you can safely ignore this email.",
        ctaLabel: "Reset My Password",
        ctaUrl: toAppLink(firebaseLink, "/reset-password"),
        secureTag: "PASSWORD RESET INITIATED",
        footerNote:
          "If you did not request this password reset, please ignore this email. Your security is our top priority.",
      },
    });
  } catch (error) {
    // user-not-found, Resend failures, etc. all return the same generic success.
    console.error("Error sending password reset email:", error);
  }

  return { ok: true };
});