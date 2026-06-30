import type { SpotCategory } from "@/lib/validation";

// Maps a Google My Maps layer/folder name (free text, German or English) to one
// of the app's spot categories. Keywords are matched as word-start stems (so
// "Museen"/"Seen" work, but "see" inside "museen" does not). Returns null when
// nothing matches (the spot is imported without a category, set later).
const RULES: { cat: SpotCategory; keywords: string[] }[] = [
  { cat: "restaurant", keywords: ["restaurant", "essen", "food", "dinner", "lunch", "imbiss"] },
  { cat: "cafe", keywords: ["cafe", "café", "coffee", "kaffee", "bäckerei", "bakery"] },
  { cat: "bar", keywords: ["bar", "pub", "brauerei", "brewery", "wein"] },
  { cat: "nightlife", keywords: ["club", "nightlife", "nachtleben", "disco"] },
  { cat: "museum", keywords: ["muse", "galerie", "gallery", "ausstellung"] },
  {
    cat: "nature",
    keywords: [
      "natur", "nature", "park", "wasserfall", "waterfall", "see", "lake",
      "strand", "beach", "wander", "hike", "trail", "berg", "mountain",
      "vulkan", "gletscher", "glacier", "aussicht", "viewpoint", "lookout",
    ],
  },
  { cat: "shopping", keywords: ["shop", "einkauf", "markt", "market", "mall"] },
  { cat: "family_friendly", keywords: ["famil", "kind", "kids", "zoo", "spielplatz"] },
  { cat: "rainy_day", keywords: ["regen", "rainy", "schlechtwetter", "indoor"] },
  { cat: "hidden_gem", keywords: ["geheim", "hidden", "secret", "insider"] },
  {
    cat: "sightseeing",
    keywords: [
      "sehensw", "sight", "attraktion", "attraction", "highlight", "foto",
      "photo", "film", "denkmal", "kirche", "church", "tempel", "schloss",
      "castle", "monument", "spot",
    ],
  },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function kmlCategory(layer?: string | null): SpotCategory | null {
  if (!layer) return null;
  const s = layer.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => new RegExp(`\\b${escape(k)}`).test(s))) {
      return rule.cat;
    }
  }
  return null;
}
