"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type AuthProvider,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider, appleProvider } from "@/lib/firebase/client";

// When the popup can't be used (blocked by the browser, or unsupported), fall
// back to a full-page redirect, which is never popup-blocked.
const REDIRECT_FALLBACK = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

type ProviderId = "google" | "apple";

export function SignInButton() {
  const router = useRouter();
  const [busy, setBusy] = useState<ProviderId | "redirect" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Exchange the signed-in Firebase user for our httpOnly session cookie.
  async function createSession(user: User) {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(data?.error ?? "Sitzung konnte nicht erstellt werden.");
    }
    router.push("/dashboard");
    router.refresh();
  }

  // Complete a redirect-based sign-in (Google or Apple) when the user returns.
  useEffect(() => {
    let active = true;
    getRedirectResult(getFirebaseAuth())
      .then((result) => {
        if (active && result?.user) {
          setBusy("redirect");
          return createSession(result.user);
        }
      })
      .catch((e) => {
        if (active) {
          setBusy(null);
          setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(id: ProviderId, provider: AuthProvider) {
    setBusy(id);
    setError(null);
    const auth = getFirebaseAuth();
    try {
      const cred = await signInWithPopup(auth, provider);
      await createSession(cred.user);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (REDIRECT_FALLBACK.has(code)) {
        try {
          await signInWithRedirect(auth, provider); // navigates away
          return;
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : "Anmeldung fehlgeschlagen.");
          setBusy(null);
          return;
        }
      }
      if (code === "auth/popup-closed-by-user") {
        setError("Anmeldung abgebrochen.");
      } else {
        setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
      }
      setBusy(null);
    }
  }

  const disabled = busy !== null;

  return (
    <div style={{ display: "grid", gap: "0.5rem", maxWidth: 280 }}>
      <button
        onClick={() => signIn("google", googleProvider)}
        disabled={disabled}
        className="btn-primary"
        style={{ padding: "0.6rem 1rem", fontSize: "1rem" }}
      >
        {busy === "google" ? "Anmeldung läuft…" : "Mit Google anmelden"}
      </button>
      <button
        onClick={() => signIn("apple", appleProvider)}
        disabled={disabled}
        style={{
          padding: "0.6rem 1rem",
          fontSize: "1rem",
          background: "#000",
          color: "#fff",
          border: "1px solid #000",
        }}
      >
        {busy === "apple" ? "Anmeldung läuft…" : "Mit Apple anmelden"}
      </button>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </div>
  );
}
