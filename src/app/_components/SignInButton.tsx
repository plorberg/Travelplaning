"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/lib/firebase/client";

// When the popup can't be used (blocked by the browser, or unsupported), fall
// back to a full-page redirect, which is never popup-blocked.
const REDIRECT_FALLBACK = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

export function SignInButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
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

  // Complete a redirect-based sign-in when the user returns from Google.
  useEffect(() => {
    let active = true;
    getRedirectResult(getFirebaseAuth())
      .then((result) => {
        if (active && result?.user) {
          setPending(true);
          return createSession(result.user);
        }
      })
      .catch((e) => {
        if (active) {
          setPending(false);
          setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn() {
    setPending(true);
    setError(null);
    const auth = getFirebaseAuth();
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await createSession(cred.user);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (REDIRECT_FALLBACK.has(code)) {
        try {
          await signInWithRedirect(auth, googleProvider); // navigates away
          return;
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : "Anmeldung fehlgeschlagen.");
          setPending(false);
          return;
        }
      }
      if (code === "auth/popup-closed-by-user") {
        setError("Anmeldung abgebrochen.");
      } else {
        setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
      }
      setPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={signIn}
        disabled={pending}
        className="btn-primary"
        style={{ padding: "0.6rem 1rem", fontSize: "1rem" }}
      >
        {pending ? "Anmeldung läuft…" : "Mit Google anmelden"}
      </button>
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
    </div>
  );
}
