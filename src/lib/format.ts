// German (de-DE) display formatting for dates, times and money. Dates are
// formatted in UTC so date-only values ("YYYY-MM-DD") and stored timestamps
// render the calendar day/time as entered, without timezone drift.

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
});

const weekdayDateFmt = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  // Treat a bare "YYYY-MM-DD" as UTC midnight.
  return new Date(value.length <= 10 ? `${value}T00:00:00Z` : value);
}

/** "Mi, 05.11.2026" — weekday + date, for timeline day headings. */
export function formatDayHeading(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? String(value) : weekdayDateFmt.format(d);
}

/** "05.11.2026" — falls back to "—" for empty values. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? String(value) : dateFmt.format(d);
}

/** "14:30" (24-hour, UTC). */
export function formatTime(value: Date | null | undefined): string {
  if (!value) return "";
  return Number.isNaN(value.getTime()) ? "" : timeFmt.format(value);
}

/** Minutes → "2:30 h" (drive time). Empty for null. */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${String(m).padStart(2, "0")} h`;
}

/**
 * "1.500,00 €" / "5.000,00 NZ$". Falls back to a plain number + code for
 * invalid/unknown currency codes so it never throws on user input.
 */
export function formatMoney(
  amount: string | number | null | undefined,
  currency: string,
): string {
  if (amount == null || amount === "") return "—";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    const num = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
    return `${num} ${currency}`;
  }
}
