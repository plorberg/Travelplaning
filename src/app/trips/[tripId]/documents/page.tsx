import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listDocuments } from "@/lib/documents";
import { hasAtLeastRole } from "@/lib/authz";
import { deleteDocumentAction } from "@/app/trips/document-actions";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  const canEdit = hasAtLeastRole(trip.role, "editor");

  const docs = await listDocuments(user.id, tripId);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← {trip.name}</Link>
      </p>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Documents &amp; tickets</h1>
        {canEdit ? <Link href={`/trips/${tripId}/documents/new`}>+ Add document</Link> : null}
      </header>

      {docs.length === 0 ? (
        <p style={{ opacity: 0.8 }}>No documents yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          {docs.map((d) => {
            const fileUrl = d.driveFileUrl ?? d.externalUrl;
            return (
              <li key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                <div>
                  <strong>{d.title}</strong>{" "}
                  <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>· {d.type}</span>
                  <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                    {d.vendor ? `${d.vendor}` : ""}
                    {d.bookingRef ? ` · ref ${d.bookingRef}` : ""}
                    {d.stopCity ? ` · ${d.stopCity}` : ""}
                    {d.price ? ` · ${d.price} ${d.currency ?? ""}` : ""}
                  </div>
                  {fileUrl ? (
                    <a href={fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem" }}>
                      Open file ↗
                    </a>
                  ) : (
                    <span style={{ opacity: 0.6, fontSize: "0.85rem" }}>metadata only</span>
                  )}
                </div>
                {canEdit ? (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <Link href={`/trips/${tripId}/documents/${d.id}/edit`}>Edit</Link>
                    <form action={deleteDocumentAction.bind(null, tripId, d.id)}>
                      <button type="submit">Delete</button>
                    </form>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
