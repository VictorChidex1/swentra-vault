// Local-dev seed: guarantees the emulator has an admin/treasury so transfers
// work, and optionally promotes your own dev login to admin (so /admin opens
// locally). Idempotent and emulator-only — it can never touch production.
import { createRequire } from 'module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(new URL('../functions/package.json', import.meta.url))
const adminApp = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

const FIRESTORE_HOST = '127.0.0.1:8080'
const AUTH_HOST = '127.0.0.1:9099'
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_HOST
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_HOST

if (!/^(127\.0\.0\.1|localhost)/.test(process.env.FIRESTORE_EMULATOR_HOST)) {
  console.error('[seed] Refusing to run: not pointed at the emulator.')
  process.exit(1)
}

adminApp.initializeApp({ projectId: 'swentra-vault' })
const db = getFirestore()
const auth = getAuth()

const TREASURY_EMAIL = 'treasury@swentra.local'
const TREASURY_PASSWORD = 'SwentraDev!23'
const CURRENCIES = ['USD', 'CHF', 'EUR', 'GBP']

function readDevAdminEmail() {
  if (process.env.DEV_ADMIN_EMAIL) return process.env.DEV_ADMIN_EMAIL.trim()
  try {
    const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
    const match = readFileSync(envPath, 'utf8').match(/^DEV_ADMIN_EMAIL=(.*)$/m)
    if (match) return match[1].trim()
  } catch {
    /* no .env.local — fine */
  }
  return ''
}

async function upsertUser(email, password) {
  try {
    const u = await auth.createUser({ email, password, emailVerified: true })
    return u.uid
  } catch {
    const u = await auth.getUserByEmail(email)
    await auth.updateUser(u.uid, { emailVerified: true })
    return u.uid
  }
}

async function provisionTreasury(uid) {
  for (const cur of CURRENCIES) {
    const c = cur.toLowerCase()
    await db.collection('users').doc(uid).collection('accounts').doc(`system-master-${c}`).set({
      id: `system-master-${c}`,
      userId: uid,
      accountNumber: `MASTER${cur}`,
      currency: cur,
      type: 'reserve',
      balance: 0,
      availableBalance: 0,
      status: 'active',
      isSystemAccount: true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })

    await db.collection('users').doc(uid).collection('accounts').doc(`system-revenue-${c}`).set({
      id: `system-revenue-${c}`,
      userId: uid,
      accountNumber: `REVENUE${cur}`,
      currency: cur,
      type: 'current',
      balance: 0,
      availableBalance: 0,
      status: 'active',
      isSystemAccount: true,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
  }
}

async function makeAdmin(uid) {
  const record = await auth.getUser(uid)
  await auth.updateUser(uid, { emailVerified: true })
  await auth.setCustomUserClaims(uid, { ...(record.customClaims || {}), admin: true })
  await db.collection('users').doc(uid).set(
    { role: 'admin', updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  )
  await provisionTreasury(uid)
}

async function main() {
  const treasuryUid = await upsertUser(TREASURY_EMAIL, TREASURY_PASSWORD)
  await makeAdmin(treasuryUid)
  console.log(`[seed] treasury admin ready: ${TREASURY_EMAIL}`)

  const devEmail = readDevAdminEmail()
  if (devEmail) {
    try {
      const u = await auth.getUserByEmail(devEmail)
      await makeAdmin(u.uid)
      console.log(`[seed] ${devEmail} promoted to admin (with treasury accounts)`)
    } catch {
      console.log(`[seed] ${devEmail} not found in the emulator yet — sign up locally, then re-run this once.`)
    }
  } else {
    console.log('[seed] DEV_ADMIN_EMAIL not set — treasury created only (transfers work; /admin on your login needs it).')
  }
  process.exit(0)
}

main().catch((error) => {
  console.error('[seed] failed:', error?.message || error)
  process.exit(1)
})