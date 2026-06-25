import { describe, it, expect } from "vitest";
import { detectConflicts } from "./conflicts";

const d = (s: string) => new Date(s);

describe("detectConflicts", () => {
  it("flags overlapping items", () => {
    const c = detectConflicts([
      { id: "a", startAt: d("2026-07-01T10:00:00Z"), endAt: d("2026-07-01T12:00:00Z") },
      { id: "b", startAt: d("2026-07-01T11:00:00Z"), endAt: d("2026-07-01T13:00:00Z") },
    ]);
    expect(c.has("a")).toBe(true);
    expect(c.has("b")).toBe(true);
  });

  it("does not flag adjacent (touching) items", () => {
    const c = detectConflicts([
      { id: "a", startAt: d("2026-07-01T10:00:00Z"), endAt: d("2026-07-01T11:00:00Z") },
      { id: "b", startAt: d("2026-07-01T11:00:00Z"), endAt: d("2026-07-01T12:00:00Z") },
    ]);
    expect(c.size).toBe(0);
  });

  it("ignores items without a full start+end range", () => {
    const c = detectConflicts([
      { id: "a", startAt: d("2026-07-01T10:00:00Z"), endAt: null },
      { id: "b", startAt: null, endAt: null },
    ]);
    expect(c.size).toBe(0);
  });
});
