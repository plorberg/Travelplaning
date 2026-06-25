#!/usr/bin/env node
// Single-instance dev runner.
//
// Running two `next dev` processes against the same project corrupts the shared
// Turbopack on-disk cache (.next/dev/cache). A corrupted cache serves a broken
// Server Action manifest, which surfaces as "Invalid Server Actions request."
// This guard refuses to start a second instance (and cleans up stale locks).
//
//   npm run dev          start (refuses if one is already running)
//   npm run dev:clean    wipe .next first, then start

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = process.cwd();
const lockFile = path.join(root, ".next-dev.lock");

const argv = process.argv.slice(2);
const clean = argv.includes("--clean");
const nextArgs = argv.filter((a) => a !== "--clean");

const portIdx = nextArgs.findIndex((a) => a === "-p" || a === "--port");
const port = Number(
  process.env.PORT ?? (portIdx !== -1 ? nextArgs[portIdx + 1] : undefined) ?? 3000,
);

const pidAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM"; // exists but owned by another user
  }
};

const fail = (msg) => {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
};

// 1) Project lock — another guarded instance is running (or clean up a stale lock).
if (existsSync(lockFile)) {
  const pid = Number(readFileSync(lockFile, "utf8").trim());
  if (pid && pidAlive(pid)) {
    fail(
      `A dev server for this project is already running (pid ${pid}).\n` +
        `  Don't start a second one — two \`next dev\` instances corrupt the\n` +
        `  shared Turbopack cache. Use the running server, or stop it first.`,
    );
  }
  rmSync(lockFile, { force: true });
}

// 2) Port check — a server started outside this guard still holds the port.
await new Promise((resolve) => {
  const probe = createServer();
  probe.once("error", (err) => {
    if (err.code === "EADDRINUSE") {
      fail(
        `Port ${port} is already in use — a dev server is likely already running.\n` +
          `  Running a second one corrupts the shared Turbopack cache. Stop it first.`,
      );
    }
    resolve();
  });
  probe.once("listening", () => probe.close(() => resolve()));
  probe.listen(port, "127.0.0.1");
});

if (clean) {
  rmSync(path.join(root, ".next"), { recursive: true, force: true });
  console.log("Removed .next (clean start).");
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", ...nextArgs], {
  stdio: "inherit",
});
writeFileSync(lockFile, String(child.pid));

const cleanup = () => {
  try {
    rmSync(lockFile, { force: true });
  } catch {}
};

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    cleanup();
    try {
      child.kill(sig);
    } catch {}
    process.exit(0);
  });
}
process.on("exit", cleanup);
child.on("exit", (code) => {
  cleanup();
  process.exit(code ?? 0);
});
