import {
  cert,
  getApps,
  getApp,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

// Lazily initialise the Admin SDK so importing this module never requires the
// service-account secrets at build time — they are only read on first use.

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

function getAdminApp(): App {
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

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}
