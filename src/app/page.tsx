import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SignInButton } from "@/app/_components/SignInButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Travelplaning</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Plan, organize, and manage your trips — solo or with others.
      </p>

      {user ? (
        <p>
          <Link href="/dashboard">Go to your dashboard →</Link>
        </p>
      ) : (
        <SignInButton />
      )}
    </main>
  );
}
