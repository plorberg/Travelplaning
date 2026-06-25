import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";

// firebase-admin is imported dynamically, only when a session is actually
// verified. A static top-level import pulls the heavy SDK into every serverless
// function that touches auth — and if it fails to load in that runtime, the
// function crashes at cold start (HTTP 500) before any handler code runs, even
// for requests with no session. Loading it lazily keeps session-less requests
// (e.g. the landing page) from ever touching it.

// Tolerate the common ways the PEM key gets mangled in env files: surrounding
// quotes that leaked in, and literal "\n" escapes that weren't expanded.
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n").trim();
}

async function getAdminApp(): Promise<App> {
  const { getApps, getApp, initializeApp, cert } = await import(
    "firebase-admin/app"
  );
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY ?? "");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env vars are not set (see .env.example).");
  }
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY is malformed — it must include the " +
        "'-----BEGIN PRIVATE KEY-----' / '-----END PRIVATE KEY-----' lines. " +
        "Copy the private_key value verbatim from your service-account JSON.",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export async function adminAuth(): Promise<Auth> {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getAdminApp());
}
