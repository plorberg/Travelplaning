"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();

  async function doSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // ignore client sign-out errors; the server session is already cleared
    }
    // The service worker caches visited pages (trips, tickets) for offline
    // use; drop them so nothing private stays readable after sign-out on a
    // shared device. Static assets (icons, JS) are fine to keep.
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k.startsWith("runtime-")).map((k) => caches.delete(k)),
        );
      }
    } catch {
      // cache cleanup is best-effort
    }
    router.push("/");
    router.refresh();
  }

  return <button onClick={doSignOut}>Abmelden</button>;
}
