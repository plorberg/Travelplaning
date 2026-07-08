import { describe, it, expect } from "vitest";
import {
  buildItineraryIcs,
  escapeIcsText,
  foldIcsLine,
  formatIcsDate,
} from "./ics";

describe("escapeIcsText", () => {
  it("escapes backslash, semicolon, comma, and newlines", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("formatIcsDate", () => {
  it("emits UTC basic format", () => {
    expect(formatIcsDate(new Date("2026-07-08T09:30:00Z"))).toBe("20260708T093000Z");
  });
});

describe("foldIcsLine", () => {
  it("keeps short lines unchanged", () => {
    expect(foldIcsLine("SUMMARY:Kurz")).toEqual(["SUMMARY:Kurz"]);
  });

  it("folds long lines to <= 75 octets with space continuations", () => {
    const folded = foldIcsLine(`SUMMARY:${"Ä".repeat(100)}`);
    expect(folded.length).toBeGreaterThan(1);
    const encoder = new TextEncoder();
    for (const l of folded) expect(encoder.encode(l).length).toBeLessThanOrEqual(75);
    for (const l of folded.slice(1)) expect(l.startsWith(" ")).toBe(true);
    // Unfolding restores the original content.
    expect(folded[0] + folded.slice(1).map((l) => l.slice(1)).join("")).toBe(
      `SUMMARY:${"Ä".repeat(100)}`,
    );
  });
});

describe("buildItineraryIcs", () => {
  const base = {
    id: "abc-123",
    title: "Louvre, Paris",
    startAt: new Date("2026-07-08T09:30:00Z"),
    endAt: new Date("2026-07-08T12:00:00Z"),
    location: "Paris",
    notes: null,
  };

  it("wraps events in a VCALENDAR and escapes text", () => {
    const ics = buildItineraryIcs("Sommer, 2026", [base]);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("X-WR-CALNAME:Sommer\\, 2026");
    expect(ics).toContain("SUMMARY:Louvre\\, Paris");
    expect(ics).toContain("DTSTART:20260708T093000Z");
    expect(ics).toContain("DTEND:20260708T120000Z");
    expect(ics).toContain("UID:abc-123@travelplaning");
  });

  it("skips undated items and defaults missing ends to one hour", () => {
    const ics = buildItineraryIcs("Trip", [
      { ...base, id: "no-date", startAt: null },
      { ...base, id: "no-end", endAt: null },
    ]);
    expect(ics).not.toContain("no-date@");
    expect(ics).toContain("DTEND:20260708T103000Z"); // 09:30 + 1h
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(1);
  });
});
