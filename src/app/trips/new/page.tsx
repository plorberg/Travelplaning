import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createTripAction } from "@/app/trips/actions";
import { TripForm } from "@/app/trips/_components/TripForm";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1>Neue Reise</h1>
      <TripForm action={createTripAction} submitLabel="Reise erstellen" />
    </main>
  );
}
