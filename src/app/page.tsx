import Link from "next/link";
import { auth, signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Travelplaning</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Plan, organize, and manage your trips — solo or with others.
      </p>

      {session?.user ? (
        <p>
          <Link href="/dashboard">Go to your dashboard →</Link>
        </p>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" style={{ padding: "0.6rem 1rem", fontSize: "1rem" }}>
            Sign in with Google
          </button>
        </form>
      )}
    </main>
  );
}
