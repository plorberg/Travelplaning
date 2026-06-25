import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { hasAtLeastRole } from "@/lib/authz";
import { createSpotAction } from "@/app/trips/spot-actions";
import { SpotForm } from "@/app/trips/_components/SpotForm";
import {
  searchPlaces,
  isPlaceKind,
  defaultCategoryForKind,
  PLACE_KINDS,
  type PlaceResult,
  type PlaceKind,
} from "@/lib/places";
import { spotCategoryLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

const ATTRIBUTION: Record<string, string> = {
  nominatim: "Ergebnisse von OpenStreetMap (Nominatim) · © OpenStreetMap-Mitwirkende",
  wikivoyage: "Ergebnisse von Wikivoyage · Inhalte unter CC BY-SA",
};

export default async function NewSpotPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tripId } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/spots`);

  const tripStops = await listStops(user.id, tripId);
  const action = createSpotAction.bind(null, tripId);

  const query = str(sp.q).trim();
  const provider = str(sp.src) === "wikivoyage" ? "wikivoyage" : "nominatim";
  const kindParam = str(sp.kind);
  const kind: PlaceKind | undefined = isPlaceKind(kindParam) ? kindParam : undefined;

  let results: PlaceResult[] = [];
  let searchFailed = false;
  if (query) {
    try {
      results = await searchPlaces(query, { provider, kind, lang: "de", limit: 8 });
    } catch {
      searchFailed = true;
    }
  }

  // "Übernehmen" reloads this page with the chosen place as form defaults.
  const useHref = (r: PlaceResult) => {
    const p = new URLSearchParams({ q: query, src: provider, name: r.name });
    if (kind) p.set("kind", kind);
    if (r.address) p.set("address", r.address);
    if (r.lat != null) p.set("lat", String(r.lat));
    if (r.lng != null) p.set("lng", String(r.lng));
    // Fall back to the chosen kind's category when the result has none.
    const category = r.category ?? defaultCategoryForKind(kind);
    if (category) p.set("category", category);
    if (r.note) p.set("notes", r.note);
    p.set("source", r.source);
    return `/trips/${tripId}/spots/new?${p.toString()}`;
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/spots`}>← Empfehlungen</Link>
      </p>
      <h1>Empfehlung hinzufügen</h1>

      <section
        style={{
          margin: "0 0 1.5rem",
          padding: "0.75rem 1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
          maxWidth: 480,
        }}
      >
        <form method="get" style={{ display: "grid", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              name="q"
              defaultValue={query || trip.mainDestination || ""}
              placeholder={
                provider === "wikivoyage"
                  ? "Reiseziel, z. B. Auckland"
                  : "Suche, z. B. Sky Tower oder Auckland"
              }
              style={{ flex: 1 }}
            />
            <button type="submit">Suchen</button>
          </div>
          <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", fontSize: "0.85rem" }}>
            Art:
            <select name="kind" defaultValue={kind ?? ""} style={{ width: "auto", flex: 1 }}>
              <option value="">Alle</option>
              {(Object.keys(PLACE_KINDS) as PlaceKind[]).map((k) => (
                <option key={k} value={k}>
                  {PLACE_KINDS[k].label}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem", opacity: 0.9 }}>
            <label style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
              <input type="radio" name="src" value="nominatim" defaultChecked={provider !== "wikivoyage"} />
              OpenStreetMap (Ort)
            </label>
            <label style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
              <input type="radio" name="src" value="wikivoyage" defaultChecked={provider === "wikivoyage"} />
              Wikivoyage (Reiseziel)
            </label>
          </div>
        </form>

        {searchFailed ? (
          <p style={{ color: "crimson", fontSize: "0.85rem" }}>
            Suche derzeit nicht verfügbar. Du kannst die Empfehlung unten manuell eingeben.
          </p>
        ) : null}
        {query && !searchFailed && results.length === 0 ? (
          <p style={{ opacity: 0.8, fontSize: "0.85rem" }}>Keine Ergebnisse.</p>
        ) : null}

        {results.length > 0 ? (
          <>
            <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0 0", display: "grid", gap: "0.6rem" }}>
              {results.map((r) => (
                <li
                  key={r.id}
                  style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}
                >
                  <div>
                    <strong>{r.name}</strong>
                    {r.category ? (
                      <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                        {" "}
                        · {spotCategoryLabels[r.category] ?? r.category}
                      </span>
                    ) : null}
                    {r.address || r.note ? (
                      <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                        {r.address || r.note}
                      </div>
                    ) : null}
                  </div>
                  <Link href={useHref(r)} style={{ whiteSpace: "nowrap" }}>
                    Übernehmen
                  </Link>
                </li>
              ))}
            </ul>
            <p style={{ opacity: 0.6, fontSize: "0.75rem", marginBottom: 0 }}>
              {ATTRIBUTION[provider]}
            </p>
          </>
        ) : null}
      </section>

      <SpotForm
        action={action}
        submitLabel="Empfehlung hinzufügen"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        defaults={{
          name: str(sp.name),
          category: str(sp.category),
          address: str(sp.address),
          lat: str(sp.lat),
          lng: str(sp.lng),
          source: str(sp.source),
          notes: str(sp.notes),
        }}
      />
    </main>
  );
}
