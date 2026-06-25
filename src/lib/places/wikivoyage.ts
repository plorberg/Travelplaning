import type { SpotCategory } from "@/lib/validation";
import type { PlaceResult, PlacesProvider } from "./types";
import { filterResultsByKind } from "./kinds";
import { mapOsmCategory } from "./osm-tags";

// Wikivoyage (a free wiki travel guide) via the MediaWiki API. For a given
// destination we fetch the article wikitext and extract its listing templates
// ({{see}}, {{do}}, {{eat}}, {{drink}}, {{buy}}, {{listing}}, {{marker}}) as
// suggested spots. Content is CC BY-SA — attribution shown in the UI.
const LANG = process.env.WIKIVOYAGE_LANG ?? "de";
const CONTACT = process.env.PLACES_CONTACT_EMAIL;
const USER_AGENT = `Travelplaning/1.0 (travel planner${CONTACT ? `; ${CONTACT}` : ""})`;

const LISTING_CATEGORY: Record<string, SpotCategory> = {
  see: "sightseeing",
  do: "sightseeing",
  eat: "restaurant",
  drink: "bar",
  buy: "shopping",
};

// Generic listing templates carry the kind in a `type=` param. `vCard` is the
// German Wikivoyage standard; `listing`/`marker` are used on en.wikivoyage.
const GENERIC_TEMPLATES = new Set(["listing", "marker", "vcard"]);
// Accommodation/transport/admin aren't "spots" — skip them.
const SKIP_TYPES = new Set([
  "sleep",
  "go",
  "hotel",
  "motel",
  "hostel",
  "guest_house",
  "apartment",
  "airport",
  "airline",
  "clinic",
  "hospital",
]);

/** Split on `sep` at top level, ignoring `{{…}}` and `[[…]]` nesting. */
export function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let curly = 0;
  let square = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === "{{") {
      curly++;
      i++;
    } else if (two === "}}") {
      curly = Math.max(0, curly - 1);
      i++;
    } else if (two === "[[") {
      square++;
      i++;
    } else if (two === "]]") {
      square = Math.max(0, square - 1);
      i++;
    } else if (s[i] === sep && curly === 0 && square === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

/** Returns the inner content of each top-level `{{…}}` template. */
export function extractTemplates(wikitext: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < wikitext.length; i++) {
    const two = wikitext.slice(i, i + 2);
    if (two === "{{") {
      if (depth === 0) start = i + 2;
      depth++;
      i++;
    } else if (two === "}}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && start >= 0) {
        out.push(wikitext.slice(start, i));
        start = -1;
      }
      i++;
    }
  }
  return out;
}

/** Reduces common wiki markup to readable plain text. */
export function stripWiki(s: string): string {
  return s
    .replace(/<ref[^>]*>.*?<\/ref>/gis, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, "$1")
    .replace(/\[https?:\/\/\S+\]/g, "")
    .replace(/'''?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseParams(parts: string[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim().toLowerCase();
    if (key) params[key] = part.slice(eq + 1).trim();
  }
  return params;
}

/** Pure parser: wikitext → spot suggestions (separated so it's testable). */
export function parseWikivoyageListings(wikitext: string, limit = 12): PlaceResult[] {
  const out: PlaceResult[] = [];
  for (const inner of extractTemplates(wikitext)) {
    const parts = splitTopLevel(inner, "|");
    const tname = parts[0].trim().toLowerCase();

    let category: SpotCategory | undefined;
    const generic = GENERIC_TEMPLATES.has(tname);
    if (tname in LISTING_CATEGORY) category = LISTING_CATEGORY[tname];
    else if (!generic) continue;

    const params = parseParams(parts.slice(1));
    if (generic) {
      const type = (params.type ?? "").toLowerCase();
      if (SKIP_TYPES.has(type)) continue;
      // German vCard `type=` uses OSM-style values (museum, park, bar, …);
      // fall back to the OSM mapping when it isn't a see/do/eat/drink/buy.
      category = LISTING_CATEGORY[type] ?? mapOsmCategory(undefined, type);
    }

    const name = stripWiki(params.name ?? "");
    if (!name) continue;

    const lat = Number(params.lat);
    const lng = Number(params.long ?? params.lon);
    const note = stripWiki(
      params.content ?? params.description ?? params.comment ?? "",
    );

    out.push({
      id: `wv/${out.length}-${name.slice(0, 40)}`,
      name,
      address: stripWiki(params.address ?? ""),
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      category,
      note: note ? (note.length > 280 ? `${note.slice(0, 277)}…` : note) : undefined,
      source: "Wikivoyage",
    });
    if (out.length >= limit) break;
  }
  return out;
}

export const wikivoyageProvider: PlacesProvider = {
  name: "wikivoyage",
  async search(query, opts) {
    const title = query.trim();
    if (!title) return [];
    const params = new URLSearchParams({
      action: "parse",
      page: title,
      prop: "wikitext",
      format: "json",
      formatversion: "2",
      redirects: "1",
    });
    const res = await fetch(`https://${LANG}.wikivoyage.org/w/api.php?${params.toString()}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Wikivoyage request failed (${res.status})`);
    const data = (await res.json()) as {
      error?: unknown;
      parse?: { wikitext?: string };
    };
    if (data.error) return []; // e.g. missing page
    // Parse all listings, then narrow by the chosen kind and cap to the limit.
    const all = parseWikivoyageListings(data.parse?.wikitext ?? "", 300);
    return filterResultsByKind(all, opts?.kind).slice(0, opts?.limit ?? 25);
  },
};
