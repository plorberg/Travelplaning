import { describe, it, expect } from "vitest";
import { parseNominatimResults } from "./nominatim";
import { mapOsmCategory } from "./osm-tags";

describe("mapOsmCategory", () => {
  it("maps specific OSM types", () => {
    expect(mapOsmCategory("tourism", "museum")).toBe("museum");
    expect(mapOsmCategory("amenity", "cafe")).toBe("cafe");
    expect(mapOsmCategory("amenity", "pub")).toBe("bar");
    expect(mapOsmCategory("leisure", "park")).toBe("nature");
  });

  it("falls back on broad category, else undefined", () => {
    expect(mapOsmCategory("tourism", "something_new")).toBe("sightseeing");
    expect(mapOsmCategory("shop", "weird")).toBe("shopping");
    expect(mapOsmCategory("highway", "residential")).toBeUndefined();
  });
});

describe("parseNominatimResults", () => {
  it("maps rows and drops entries without coordinates", () => {
    const rows = [
      {
        osm_type: "node",
        osm_id: 42,
        lat: "-36.8485",
        lon: "174.7633",
        name: "Sky Tower",
        display_name: "Sky Tower, Victoria Street West, Auckland",
        category: "tourism",
        type: "attraction",
      },
      { name: "No coords", display_name: "Somewhere" }, // dropped
    ];
    const out = parseNominatimResults(rows);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "node/42",
      name: "Sky Tower",
      lat: -36.8485,
      lng: 174.7633,
      category: "sightseeing",
      source: "OpenStreetMap",
    });
  });

  it("derives a name from display_name when name is absent", () => {
    const out = parseNominatimResults([
      { lat: "1", lon: "2", display_name: "Eiffel Tower, Paris, France" },
    ]);
    expect(out[0].name).toBe("Eiffel Tower");
  });

  it("returns [] for non-array input", () => {
    expect(parseNominatimResults(null)).toEqual([]);
    expect(parseNominatimResults({})).toEqual([]);
  });
});
