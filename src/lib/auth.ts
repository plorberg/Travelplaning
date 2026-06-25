import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "session";

export type CurrentUser = {
  id: string; // Firebase UID — the FK target in Postgres.
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * Reads and verifies the Firebase session cookie. Returns the current user, or
 * null if there is no valid session. This is the single server-side source of
 * identity; the data-access layer takes the returned `id` and authorizes every
 * query against `trip_members`.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await (await adminAuth()).verifySessionCookie(cookie, true);
    return {
      id: decoded.uid,
      email: decoded.email ?? "",
      name: (decoded.name as string | undefined) ?? null,
      image: (decoded.picture as string | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
