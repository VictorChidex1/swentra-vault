// Backfill party names on transaction records.
//
// Fixes two legacy issues left by the old transfer writer (which stored the
// sender's email when the account had no display name):
//
//   1. RECIPIENT side: INCOMING_TRANSFER.sourceDetails.senderName shows the
//      sender's email / stale display name instead of their KYC legal name.
//   2. SENDER side: internal outgoing recipientDetails.fullName is missing or
//      the placeholder "Swentra Vault User" instead of the recipient's legal name.
//
// Safe by design:
//   * Dry-run by default. Pass --apply to write.
//   * Only rewrites a name when it is missing, looks like an email address, is
//     the "Swentra Vault User" placeholder, or equals the party's Auth display
//     name — it never clobbers a value that already differs for another reason.
//   * Skips any record whose party has no resolvable legal name.
//
// Target: the Firestore emulator when FIRESTORE_EMULATOR_HOST is set, otherwise
// PRODUCTION (using the Firebase CLI's OAuth token). Read/write via REST API.
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT = 'swentra-vault';
const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST || '';
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const APPLY = process.argv.includes('--apply');
const PLACEHOLDER = 'Swentra Vault User';
const EMAIL_RE = /\S+@\S+\.\S+/;

const DB_BASE = EMULATOR
  ? `http://${EMULATOR}/v1/projects/${PROJECT}/databases/(default)/documents`
  : `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const IDT_BASE = EMULATOR
  ? `http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}`
  : `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;

let TOKEN = null;
if (!EMULATOR) {
  const cfg = JSON.parse(
    readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'),
  );
  TOKEN = cfg.tokens?.access_token;
  if (!TOKEN) {
    console.error('No Firebase CLI access token found. Run a firebase command first.');
    process.exit(1);
  }
}
const authHeaders = () =>
  TOKEN
    ? { Authorization: `Bearer ${TOKEN}` }
    : { Authorization: 'Bearer owner' }; // emulator: bypass security rules

const str = (v) => (v && v.stringValue != null ? v.stringValue : '');
const relPath = (name) => String(name).split('/documents/')[1];

async function listDocs(collPath) {
  const out = [];
  let pageToken;
  do {
    const url = `${DB_BASE}/${collPath}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`list ${collPath} ${res.status}: ${(await res.json())?.error?.message || ''}`);
    const json = await res.json();
    (json.documents || []).forEach((d) => out.push(d));
    pageToken = json.nextPageToken;
  } while (pageToken);
  return out;
}

async function getDoc(docPath) {
  const res = await fetch(`${DB_BASE}/${docPath}`, { headers: authHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get ${docPath} ${res.status}`);
  return res.json();
}

function nestedFields(pathStr, value) {
  const parts = pathStr.split('.');
  let node = { stringValue: value };
  for (let i = parts.length - 1; i >= 0; i--) {
    node = { mapValue: { fields: { [parts[i]]: node } } };
  }
  return node.mapValue.fields;
}

async function patch(rel, mask, value) {
  const url = `${DB_BASE}/${rel}?updateMask.fieldPaths=${encodeURIComponent(mask)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: nestedFields(mask, value) }),
  });
  if (!res.ok) throw new Error(`PATCH ${rel} ${res.status}: ${(await res.json())?.error?.message || ''}`);
}

async function legalName(uid) {
  try {
    const d = await getDoc(`users/${uid}/kyc/submission`);
    const p = d?.fields?.personalDetails?.mapValue?.fields;
    if (p && (p.firstName || p.lastName)) {
      const name = `${str(p.firstName)} ${str(p.lastName)}`.trim();
      if (name) return name;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function displayName(uid) {
  try {
    const res = await fetch(`${IDT_BASE}/accounts:lookup`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: [uid] }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.users?.[0]?.displayName || null;
  } catch {
    return null;
  }
}

const legalCache = new Map();
const dnCache = new Map();
const legalOf = async (uid) => {
  if (!legalCache.has(uid)) legalCache.set(uid, await legalName(uid));
  return legalCache.get(uid);
};
const dnOf = async (uid) => {
  if (!dnCache.has(uid)) dnCache.set(uid, await displayName(uid));
  return dnCache.get(uid);
};

async function main() {
  console.log(`Target: ${EMULATOR ? `EMULATOR (${EMULATOR})` : 'PRODUCTION'}  |  mode: ${APPLY ? 'APPLY (writing)' : 'DRY-RUN'}`);

  const userDocs = await listDocs('users');
  const uids = userDocs.map((d) => relPath(d.name).split('/')[1]);
  console.log(`users: ${uids.length}`);

  const changes = [];
  let scanned = 0;
  for (const uid of uids) {
    const txns = await listDocs(`users/${uid}/transactions`);
    scanned += txns.length;
    for (const t of txns) {
      const f = t.fields || {};
      const type = str(f.type);
      const rel = relPath(t.name);
      const id = rel.split('/')[3];
      const from = str(f.reference) || 'Funds Transfer';

      if (type === 'INCOMING_TRANSFER') {
        // Recipient side: fix the sender's name.
        const src = f.sourceDetails?.mapValue?.fields;
        const senderId = src ? str(src.senderId) : '';
        if (!senderId) continue;
        const current = src ? str(src.senderName) : '';
        const legal = await legalOf(senderId);
        if (!legal || current === legal) continue;
        if (!current || EMAIL_RE.test(current) || current === (await dnOf(senderId))) {
          changes.push({ rel, id, side: 'recipient', from: current, to: legal, mask: 'sourceDetails.senderName' });
        }
      } else if (type === 'SWENTRA_TRANSFER' || type === 'INTERNAL_TRANSFER') {
        // Sender side: fix the beneficiary name.
        const rd = f.recipientDetails?.mapValue?.fields;
        const current = rd ? str(rd.fullName) : '';
        if (current && current !== PLACEHOLDER && !EMAIL_RE.test(current)) continue;
        let rUid = str(f.counterpartyUid);
        if (!rUid && rd) {
          const acct = str(rd.accountNumber).replace(/\s/g, '');
          if (acct) {
            const reg = await getDoc(`accountNumbers/${acct}`);
            rUid = reg ? str(reg.fields?.assignedTo) : '';
          }
        }
        if (!rUid) continue;
        const legal = await legalOf(rUid);
        if (!legal || current === legal) continue;
        changes.push({ rel, id, side: 'sender', from: current, to: legal, mask: 'recipientDetails.fullName' });
      }
    }
  }

  console.log(`transactions scanned: ${scanned}`);
  console.log(`\nProposed fixes: ${changes.length}`);
  for (const c of changes) {
    console.log(`  [${c.side}] ${c.rel}`);
    console.log(`      "${c.from || '(empty)'}"  ->  "${c.to}"`);
  }

  if (!APPLY) {
    console.log('\nDRY-RUN — nothing written. Re-run with --apply to apply.');
    process.exit(0);
  }

  let done = 0;
  for (const c of changes) {
    try {
      await patch(c.rel, c.mask, c.to);
      done++;
    } catch (e) {
      console.error(`  ! failed ${c.rel}: ${e.message}`);
    }
  }
  console.log(`\nAPPLIED: ${done}/${changes.length} updated.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('[backfill] failed:', e?.message || e);
  process.exit(1);
});
