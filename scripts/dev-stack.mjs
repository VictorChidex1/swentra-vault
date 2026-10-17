// Local dev orchestration: start the Firebase emulators, wait until they're
// reachable, seed the treasury + dev admin, then run the wire-completion cron.
// One command (`npm run emulators`) does everything; Ctrl-C stops it all.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, '.emulator-data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const emulators = spawn(
  'npx',
  ['firebase', 'emulators:start', '--import=./.emulator-data', '--export-on-exit=./.emulator-data'],
  { cwd: root, stdio: 'inherit' },
)

let wireCron = null
let shuttingDown = false

function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  try { wireCron?.kill('SIGINT') } catch { /* ignore */ }
  try { emulators.kill('SIGINT') } catch { /* ignore */ }
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

async function waitForPort(port, timeoutMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(`http://127.0.0.1:${port}/`)
      return true
    } catch {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  return false
}

function runOnce(script) {
  return new Promise((resolve) => {
    const child = spawn('node', [path.join('scripts', script)], { cwd: root, stdio: 'inherit' })
    child.on('exit', resolve)
  })
}

async function main() {
  const authUp = await waitForPort(9099)
  const firestoreUp = await waitForPort(8080)
  if (!authUp || !firestoreUp) {
    console.error('[dev-stack] emulators did not come up in time; skipping seed.')
    return
  }

  console.log('\n[dev-stack] emulators ready — seeding treasury + dev admin…')
  await runOnce('seed-emulator.mjs')

  console.log('[dev-stack] starting wire-completion cron…\n')
  wireCron = spawn('node', [path.join('scripts', 'dev-wire-cron.mjs')], { cwd: root, stdio: 'inherit' })
}

main()