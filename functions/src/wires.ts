import * as functions from "firebase-functions/v1";
import { completePendingWires } from "./wireCompletion";

// Scheduled EXTERNAL_WIRE completion. Runs every 3 minutes (UTC). The actual
// work lives in ./wireCompletion so the local-dev cron script
// (scripts/dev-wire-cron.mjs) can reuse the exact same logic.
export const completePendingWireTransfers = functions.pubsub
  .schedule("every 3 minutes")
  .timeZone("UTC")
  .onRun(async () => {
    await completePendingWires();
  });