import { describe, it, expect } from "vitest";
import { kmlCategory } from "./kml-category";

describe("kmlCategory", () => {
  it("maps common German/English layer names", () => {
    expect(kmlCategory("Restaurants")).toBe("restaurant");
    expect(kmlCategory("Cafés & Bäckereien")).toBe("cafe");
    expect(kmlCategory("Natur & Wasserfälle")).toBe("nature");
    expect(kmlCategory("Museen")).toBe("museum");
    expect(kmlCategory("Fotospots")).toBe("sightseeing");
    expect(kmlCategory("Filmspots / Highlights")).toBe("sightseeing");
  });

  it("is case-insensitive", () => {
    expect(kmlCategory("BEACHES")).toBe("nature");
  });

  it("returns null for unknown or empty layers", () => {
    expect(kmlCategory("Ebene ohne Titel")).toBeNull();
    expect(kmlCategory("")).toBeNull();
    expect(kmlCategory(null)).toBeNull();
  });
});
