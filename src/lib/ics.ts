// Pure iCalendar (RFC 5545) builder for the itinerary export — no
// dependencies, unit-tested. Times are emitted in UTC (timestamptz values).

export interface IcsEvent {
  id: string;
  title: string;
  startAt: Date | null;
  endAt: Date | null;
  location?: string | null;
  notes?: string | null;
}

const CRLF = "\r\n";
const DEFAULT_DURATION_MS = 60 * 60 * 1000; // events without an end: 1 hour

/** TEXT escaping per RFC 5545: backslash, semicolon, comma, newline. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** UTC timestamp in basic format: 20260708T093000Z */
export function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const encoder = new TextEncoder();

/**
 * Folds a content line to lines of at most 75 octets; continuations are
 * prefixed with a single space (RFC 5545 §3.1). Splits on character
 * boundaries so multi-byte UTF-8 sequences stay intact.
 */
export function foldIcsLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let budget = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (encoder.encode(current).length + size > budget) {
      out.push(current);
      current = " ";
      budget = 75; // continuation lines: leading space counts toward the 75
    }
    current += ch;
  }
  out.push(current);
  return out;
}

export function buildItineraryIcs(calendarName: string, events: IcsEvent[]): string {
  const now = formatIcsDate(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Travelplaning//Reiseplan//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  for (const ev of events) {
    if (!ev.startAt) continue; // undated items can't be calendar events
    const start = ev.startAt;
    const end =
      ev.endAt && ev.endAt.getTime() > start.getTime()
        ? ev.endAt
        : new Date(start.getTime() + DEFAULT_DURATION_MS);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@travelplaning`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(ev.title)}`,
    );
    if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    if (ev.notes) lines.push(`DESCRIPTION:${escapeIcsText(ev.notes)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.flatMap(foldIcsLine).join(CRLF) + CRLF;
}
