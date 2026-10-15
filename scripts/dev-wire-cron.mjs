// Local-dev replacement for Cloud Scheduler.
//
// The Firebase Emulator Suite never fires scheduled functions, so this script
// runs the SAME wire-completion logic (functions/src/wireCompletion.ts) against
// the emulator every 2 minutes, with emails skipped.
//
// Usage:  npm run dev:wire-cron          (keeps running; Ctrl-C to stop)
//         node scripts/dev-wire-cron.mjs --once   (single run, then exit)
//
// Safety: it only ever points at the emulator (127.0.0.1) and refuses to run
// otherwise, so it can never complete wires in production.
import { createRequire } from 'module';

const require = createRequire(new URL('../functions/package.json', import.meta.url));
const adminApp = require('firebase-admin/app');

const FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const AUTH_EMULATOR_HOST = '127.0.0.1:9099';

process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_EMULATOR_HOST;

if (!/^(127\.0\.0\.1|localhost)/.test(process.env.FIRESTORE_EMULATOR_HOST)) {
  console.error('[dev-wire-cron] Refusing to run: not pointed at the emulator.');
  process.exit(1);
}

adminApp.initializeApp({ projectId: 'swentra-vault' });
const { completePendingWires } = require('./lib/wireCompletion.js');

const INTERVAL_MS = 2 * 60 * 1000;
const ONCE = process.argv.includes('--once');

async function tick() {
  try {
    const result = await completePendingWires({ skipEmail: true });
    console.log(
      `[dev-wire-cron ${new Date().toISOString()}] completed=${result.completed} (emails skipped)`,
    );
  } catch (error) {
    console.error('[dev-wire-cron] run failed:', error?.message || error);
  }
}

async function run() {
  await tick();
  if (ONCE) {
    process.exit(0);
  }
  setInterval(tick, INTERVAL_MS);
  console.log(
    `[dev-wire-cron] watching the emulator every ${INTERVAL_MS / 60000} min (Ctrl-C to stop)`,
  );
}

run();