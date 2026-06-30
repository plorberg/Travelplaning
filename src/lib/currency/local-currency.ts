// Best-effort mapping of common destination countries (German + English names)
// to their currency, so an expense can offer "€ or the local currency". An
// unknown or ambiguous destination yields null — then only € is offered.

type Entry = { code: string; names: string[] };

const COUNTRIES: Entry[] = [
  // Eurozone — local currency is also the Euro.
  {
    code: "EUR",
    names: [
      "deutschland", "germany", "österreich", "osterreich", "austria",
      "frankreich", "france", "spanien", "spain", "italien", "italy",
      "niederlande", "netherlands", "holland", "belgien", "belgium",
      "portugal", "griechenland", "greece", "irland", "ireland",
      "finnland", "finland", "luxemburg", "luxembourg", "slowakei",
      "slovakia", "slowenien", "slovenia", "estland", "estonia",
      "lettland", "latvia", "litauen", "lithuania", "kroatien", "croatia",
      "malta", "zypern", "cyprus",
    ],
  },
  { code: "USD", names: ["usa", "u.s.a", "vereinigte staaten", "united states", "amerika", "america"] },
  {
    code: "GBP",
    names: [
      "vereinigtes königreich", "vereinigtes konigreich", "united kingdom",
      "großbritannien", "grossbritannien", "great britain", "britain",
      "england", "schottland", "scotland", "wales",
    ],
  },
  { code: "CHF", names: ["schweiz", "switzerland"] },
  { code: "JPY", names: ["japan"] },
  { code: "CNY", names: ["china"] },
  { code: "THB", names: ["thailand"] },
  { code: "AUD", names: ["australien", "australia"] },
  { code: "NZD", names: ["neuseeland", "new zealand"] },
  { code: "CAD", names: ["kanada", "canada"] },
  { code: "NOK", names: ["norwegen", "norway"] },
  { code: "SEK", names: ["schweden", "sweden"] },
  { code: "DKK", names: ["dänemark", "danemark", "denmark"] },
  { code: "PLN", names: ["polen", "poland"] },
  { code: "CZK", names: ["tschechien", "tschechei", "czech"] },
  { code: "HUF", names: ["ungarn", "hungary"] },
  { code: "ISK", names: ["island", "iceland"] },
  { code: "TRY", names: ["türkei", "turkei", "turkey"] },
  { code: "MXN", names: ["mexiko", "mexico"] },
  { code: "BRL", names: ["brasilien", "brazil"] },
  { code: "ARS", names: ["argentinien", "argentina"] },
  { code: "ZAR", names: ["südafrika", "sudafrika", "south africa"] },
  { code: "INR", names: ["indien", "india"] },
  { code: "IDR", names: ["indonesien", "indonesia", "bali"] },
  { code: "VND", names: ["vietnam"] },
  { code: "SGD", names: ["singapur", "singapore"] },
  { code: "MYR", names: ["malaysia"] },
  { code: "PHP", names: ["philippinen", "philippines"] },
  { code: "KRW", names: ["südkorea", "sudkorea", "south korea", "korea"] },
  { code: "HKD", names: ["hongkong", "hong kong"] },
  { code: "AED", names: ["vereinigte arabische emirate", "emirate", "dubai", "abu dhabi", "uae"] },
  { code: "EGP", names: ["ägypten", "agypten", "egypt"] },
  { code: "MAD", names: ["marokko", "morocco"] },
  { code: "ILS", names: ["israel"] },
];

// Longest names first so e.g. "vereinigte staaten" wins before a short token.
const LOOKUP: { code: string; pattern: RegExp }[] = COUNTRIES.flatMap((c) =>
  c.names.map((n) => ({ code: c.code, name: n })),
)
  .sort((a, b) => b.name.length - a.name.length)
  .map(({ code, name }) => ({
    code,
    pattern: new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
  }));

/**
 * Derives the destination's currency from the trip's stop countries (preferred)
 * and main destination text. Returns an ISO code, or null if nothing matches.
 */
export function localCurrencyForDestination(
  mainDestination?: string | null,
  countries: (string | null | undefined)[] = [],
): string | null {
  const candidates = [...countries, mainDestination]
    .filter((s): s is string => !!s && s.trim() !== "")
    .map((s) => s.toLowerCase());

  for (const candidate of candidates) {
    const hit = LOOKUP.find((l) => l.pattern.test(candidate));
    if (hit) return hit.code;
  }
  return null;
}
