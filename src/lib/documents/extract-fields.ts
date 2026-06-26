// Best-effort heuristics to pull a few fields out of a ticket/booking's plain
// text (extracted client-side from a PDF). Intentionally conservative: it only
// fills a field when a pattern matches confidently, so it never overwrites good
// data with a bad guess. Pure + unit-tested; the PDF text extraction lives in
// the form (browser-only).

export type ParsedDocFields = {
  bookingRef?: string;
  price?: string; // normalised "1234.56"
  currency?: string; // ISO 4217 code
  startAt?: string; // "YYYY-MM-DD"
  endAt?: string; // "YYYY-MM-DD"
};

const CURRENCY_SYMBOL: Record<string, string> = {
  "€": "EUR",
  $: "USD",
  "£": "GBP",
  "₣": "CHF",
  "¥": "JPY",
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, mär: 3, apr: 4, may: 5, mai: 5, jun: 6, jul: 7,
  aug: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, dez: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const valid = (y: number, m: number, d: number) =>
  y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

/** Normalises "1.234,56" / "1,234.56" / "1234" to a dot-decimal string. */
export function normalizeAmount(raw: string): string | undefined {
  let s = raw.replace(/\s/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // The right-most separator is the decimal point.
    const dec = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thou = dec === "," ? "." : ",";
    s = s.split(thou).join("").replace(dec, ".");
  } else if (hasComma) {
    // Comma is decimal only with exactly 2 trailing digits, else thousands.
    s = /,\d{2}$/.test(s) ? s.replace(",", ".") : s.split(",").join("");
  } else if (hasDot) {
    if (!/\.\d{2}$/.test(s) && /\.\d{3}(\D|$)/.test(s + "x")) s = s.split(".").join("");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? s : undefined;
}

function findBookingRef(text: string): string | undefined {
  const re =
    /(?:buchungs(?:nummer|code|referenz)?|booking\s*(?:reference|ref|code|number|no\.?)|confirmation\s*(?:number|code|no\.?)?|reservierungs(?:nummer|code)|record\s*locator|pnr|filekey)\s*[:#-]?\s*([A-Z0-9]{5,12})\b/i;
  const m = text.match(re);
  return m ? m[1].toUpperCase() : undefined;
}

function findPrice(text: string): { price?: string; currency?: string } {
  const cur = "(€|\\$|£|¥|₣|EUR|USD|GBP|CHF|JPY|NZD|AUD|CAD)";
  const amt = "([0-9][0-9.,\\s]*[0-9])";
  // Prefer amounts near a "total"-style keyword; else any currency+amount.
  const keyed = new RegExp(
    `(?:total|gesamt(?:betrag|preis)?|summe|betrag|amount|zu\\s*zahlen|to\\s*pay|price|preis)\\D{0,12}?(?:${cur}\\s*${amt}|${amt}\\s*${cur})`,
    "i",
  );
  const loose = new RegExp(`(?:${cur}\\s*${amt}|${amt}\\s*${cur})`, "i");
  const m = text.match(keyed) ?? text.match(loose);
  if (!m) return {};
  const symbol = (m[1] ?? m[4] ?? m[5] ?? m[3] ?? "").toString();
  const number = (m[2] ?? m[3] ?? m[6] ?? "").toString();
  const price = normalizeAmount(number);
  if (!price) return {};
  const sym = symbol.toUpperCase();
  const currency = CURRENCY_SYMBOL[symbol] ?? (/^[A-Z]{3}$/.test(sym) ? sym : undefined);
  return { price, currency };
}

function collectDates(text: string): string[] {
  const out = new Set<string>();
  // 2026-11-08
  for (const m of text.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (valid(y, mo, d)) out.add(iso(y, mo, d));
  }
  // 08.11.2026 or 08/11/2026 (day-first)
  for (const m of text.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/g)) {
    const [d, mo, y] = [+m[1], +m[2], +m[3]];
    if (valid(y, mo, d)) out.add(iso(y, mo, d));
  }
  // 8 Nov 2026 / 8. November 2026
  for (const m of text.matchAll(/\b(\d{1,2})\.?\s+([A-Za-zäöü]{3,})\.?\s+(20\d{2})\b/g)) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const [d, y] = [+m[1], +m[3]];
    if (mo && valid(y, mo, d)) out.add(iso(y, mo, d));
  }
  return [...out].sort();
}

export function extractDocumentFields(text: string): ParsedDocFields {
  const fields: ParsedDocFields = {};
  const bookingRef = findBookingRef(text);
  if (bookingRef) fields.bookingRef = bookingRef;

  const { price, currency } = findPrice(text);
  if (price) fields.price = price;
  if (currency) fields.currency = currency;

  const dates = collectDates(text);
  if (dates.length >= 1) fields.startAt = dates[0];
  if (dates.length >= 2) fields.endAt = dates[dates.length - 1];

  return fields;
}
