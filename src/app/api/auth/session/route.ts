import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth";

// 14 days.
const EXPIRES_IN_MS = 60 * 60 * 24 * 14 * 1000;

// Exchange a freshly minted Firebase ID token for an httpOnly session cookie,
// and mirror the user into Postgres so trips/membership can reference them.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { idToken?: unknown }
    | null;
  const idToken = body?.idToken;
  if (typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const profile = {
    email: decoded.email ?? "",
    name: (decoded.name as string | undefined) ?? null,
    image: (decoded.picture as string | undefined) ?? null,
  };
  await db
    .insert(users)
    .values({ id: decoded.uid, ...profile })
    .onConflictDoUpdate({ target: users.id, set: profile });

  const sessionCookie = await adminAuth().createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: EXPIRES_IN_MS / 1000,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
