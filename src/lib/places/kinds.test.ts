import { describe, it, expect } from "vitest";
import {
  PLACE_KINDS,
  defaultCategoryForKind,
  filterResultsByKind,
  isPlaceKind,
} from "./kinds";
import type { PlaceResult } from "./types";

const result = (id: string, category?: PlaceResult["category"]): PlaceResult => ({
  id,
  name: id,
  address: "",
  category,
  source: "test",
});

describe("isPlaceKind", () => {
  it("recognises known kinds only", () => {
    expect(isPlaceKind("food")).toBe(true);
    expect(isPlaceKind("sights")).toBe(true);
    expect(isPlaceKind("hotels")).toBe(false);
    expect(isPlaceKind("")).toBe(false);
  });
});

describe("PLACE_KINDS", () => {
  it("every kind has a label, categories and Overpass selectors", () => {
    for (const kind of Object.values(PLACE_KINDS)) {
      expect(kind.label.length).toBeGreaterThan(0);
      expect(kind.categories.length).toBeGreaterThan(0);
      expect(kind.overpass.length).toBeGreaterThan(0);
      expect(kind.overpass.every((s) => s.includes("nwr["))).toBe(true);
    }
  });
});

describe("filterResultsByKind", () => {
  const results = [
    result("a", "restaurant"),
    result("b", "cafe"),
    result("c", "museum"),
    result("d", undefined),
  ];

  it("keeps only the kind's categories", () => {
    expect(filterResultsByKind(results, "food").map((r) => r.id)).toEqual(["a", "b"]);
    expect(filterResultsByKind(results, "sights").map((r) => r.id)).toEqual(["c"]);
  });
  it("returns all results when no kind is given", () => {
    expect(filterResultsByKind(results, undefined)).toHaveLength(4);
  });
});

describe("defaultCategoryForKind", () => {
  it("returns the kind's primary category, or undefined", () => {
    expect(defaultCategoryForKind("food")).toBe("restaurant");
    expect(defaultCategoryForKind("nature")).toBe("nature");
    expect(defaultCategoryForKind(undefined)).toBeUndefined();
  });
});
