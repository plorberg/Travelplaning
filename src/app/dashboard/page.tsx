import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripsForUser } from "@/lib/trips";
import { SignOutButton } from "@/app/_components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trips = await getTripsForUser(user.id);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <span style={{ opacity: 0.8 }}>Signed in as {user.email}</span>
        <SignOutButton />
      </header>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h1>Your trips</h1>
        <Link href="/trips/new">+ New trip</Link>
      </div>
      {trips.length === 0 ? (
        <p style={{ opacity: 0.8 }}>
          No trips yet. <Link href="/trips/new">Create your first trip</Link>.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}`}>
                <strong>{trip.name}</strong>
              </Link>
              {trip.mainDestination ? ` — ${trip.mainDestination}` : ""} ·{" "}
              {trip.status} · your role: {trip.role}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
