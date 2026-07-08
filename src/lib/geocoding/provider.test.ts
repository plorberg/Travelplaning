import { describe, it, expect } from "vitest";
import { mockProvider } from "./mock";

describe("geocoding mockProvider", () => {
  it("returns known coordinates for a known city", async () => {
    const r = await mockProvider.geocode("Berlin, Germany");
    expect(r).not.toBeNull();
    expect(r!.lat).toBeCloseTo(52.52, 1);
    expect(r!.source).toBe("mock");
  });

  it("is deterministic and in-range for unknown queries", async () => {
    const a = await mockProvider.geocode("Zzyxville");
    const b = await mockProvider.geocode("Zzyxville");
    expect(a).toEqual(b);
    expect(a!.lat).toBeGreaterThanOrEqual(-90);
    expect(a!.lat).toBeLessThanOrEqual(90);
    expect(a!.lng).toBeGreaterThanOrEqual(-180);
    expect(a!.lng).toBeLessThanOrEqual(180);
  });

  it("returns null for empty input", async () => {
    expect(await mockProvider.geocode("   ")).toBeNull();
  });
});
