import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createTripAction } from "@/app/trips/actions";
import { TripForm } from "@/app/trips/_components/TripForm";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1>New trip</h1>
      <TripForm action={createTripAction} submitLabel="Create trip" />
    </main>
  );
}
