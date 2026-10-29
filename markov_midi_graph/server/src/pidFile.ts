import { readFileSync, rmSync, writeFileSync } from "node:fs"

// server/.api.pid records which processes are this backend, so
// scripts/api.sh can find them and verify them before sending a signal.
// Line 1: this server process. Line 2: its parent, which is the
// `node --watch` process under `npm run dev` (api.sh ignores it otherwise).
const pidFile = new URL("../.api.pid", import.meta.url)

export function writePidFile() {
  writeFileSync(pidFile, `${process.pid}\n${process.ppid}\n`, { mode: 0o600 })
}

// Only remove the record if it is still ours: after a --watch restart the
// new server process may already have written its own.
export function removePidFile() {
  try {
    const recordedPid = readFileSync(pidFile, "utf8").split("\n")[0]
    if (recordedPid === String(process.pid)) rmSync(pidFile)
  } catch {
    // Already gone; nothing to do.
  }
}
