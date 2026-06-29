import { describe, it, expect } from "vitest";
import { buildOverpassQuery, parseOverpassElements } from "./overpass";

describe("buildOverpassQuery", () => {
  it("wraps each selector in an around clause for the kind", () => {
    const q = buildOverpassQuery(-36.85, 174.76, "food", 8000);
    expect(q).toContain('nwr["amenity"~"^(restaurant|cafe)$"](around:8000,-36.85,174.76);');
    expect(q).toContain("out center");
  });
});

describe("parseOverpassElements", () => {
  const json = {
    elements: [
      {
        type: "node",
        id: 1,
        lat: -36.85,
        lon: 174.76,
        tags: { name: "Alma", amenity: "restaurant", "addr:street": "High St" },
      },
      {
        type: "way",
        id: 2,
        center: { lat: -36.84, lon: 174.75 },
        tags: { name: "Auckland Museum", tourism: "museum" },
      },
      { type: "node", id: 3, lat: -36.8, lon: 174.7, tags: { amenity: "bar" } }, // no name -> dropped
      { type: "node", id: 4, tags: { name: "No coords", amenity: "cafe" } }, // no coords -> dropped
    ],
  };

  it("maps named elements with coordinates and categories", () => {
    const out = parseOverpassElements(json);
    expect(out.map((r) => r.name)).toEqual(["Alma", "Auckland Museum"]);
    expect(out[0]).toMatchObject({
      id: "node/1",
      lat: -36.85,
      lng: 174.76,
      category: "restaurant",
      address: "High St",
      source: "OpenStreetMap",
    });
    expect(out[1]).toMatchObject({ lat: -36.84, lng: 174.75, category: "museum" });
  });

  it("respects the limit and tolerates junk input", () => {
    expect(parseOverpassElements(json, 1)).toHaveLength(1);
    expect(parseOverpassElements(null)).toEqual([]);
    expect(parseOverpassElements({})).toEqual([]);
  });

  it("prefers a German/Latin name over the local name tag", () => {
    const localized = {
      elements: [
        { type: "node", id: 10, lat: 35.6, lon: 139.7, tags: { name: "東京タワー", "name:de": "Tokyoturm", "name:en": "Tokyo Tower", tourism: "attraction" } },
        { type: "node", id: 11, lat: 35.6, lon: 139.7, tags: { name: "浅草寺", "name:en": "Sensoji", tourism: "attraction" } },
        { type: "node", id: 12, lat: 35.6, lon: 139.7, tags: { name: "明治神宮", int_name: "Meiji Jingu", tourism: "attraction" } },
        { type: "node", id: 13, lat: 35.6, lon: 139.7, tags: { name: "ローカル", tourism: "attraction" } },
      ],
    };
    expect(parseOverpassElements(localized).map((r) => r.name)).toEqual([
      "Tokyoturm",
      "Sensoji",
      "Meiji Jingu",
      "ローカル",
    ]);
  });
});
