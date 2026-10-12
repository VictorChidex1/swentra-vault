import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export const APP_URL = process.env.APP_URL || "https://swentravault.com";
export const MAIL_FROM =
  process.env.MAIL_FROM || "Swentra Vault <noreply@send.swentravault.com>";
export const MAIL_REPLY_TO =
  process.env.MAIL_REPLY_TO || "support@swentravault.com";

// Cooldown window for auth emails. Guards against inbox flooding and lets the
// reset endpoint answer uniformly for known and unknown addresses.
export const EMAIL_COOLDOWN_MS = 60_000;

// EXTERNAL_WIRE lifecycle: wires stay PROCESSING until the scheduled completions
// run (pubsub, every 3 minutes) flips them to COMPLETED once they are at least
// this old.
export const WIRE_COMPLETION_MIN_AGE_MS = 2 * 60_000;