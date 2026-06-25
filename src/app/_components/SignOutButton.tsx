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
    router.push("/");
    router.refresh();
  }

  return <button onClick={doSignOut}>Abmelden</button>;
}
