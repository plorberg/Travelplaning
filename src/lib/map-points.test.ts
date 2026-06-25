import { describe, it, expect } from "vitest";
import { toMapPoints } from "./map-points";

describe("toMapPoints", () => {
  const stops = [
    { id: "s1", city: "Auckland", country: "Neuseeland", lat: -36.85, lng: 174.76 },
    { id: "s2", city: "Ohne Koordinaten", country: null, lat: null, lng: null },
  ];
  const spots = [
    { id: "p1", name: "Sky Tower", category: "sightseeing", lat: -36.84, lng: 174.76 },
    { id: "p2", name: "Kein Punkt", category: null, lat: null, lng: 1 },
  ];

  it("drops rows without coordinates and tags kind", () => {
    const pts = toMapPoints(stops, spots);
    expect(pts.map((p) => p.id)).toEqual(["stop-s1", "spot-p1"]);
    expect(pts[0]).toMatchObject({ name: "Auckland", kind: "stop", sub: "Neuseeland" });
    expect(pts[1]).toMatchObject({ name: "Sky Tower", kind: "spot" });
  });

  it("uses the German category label for spot subtitles", () => {
    const pts = toMapPoints([], spots);
    expect(pts[0].sub).toBe("Sehenswürdigkeit");
  });

  it("returns [] when nothing has coordinates", () => {
    expect(toMapPoints([stops[1]], [spots[1]])).toEqual([]);
  });
});
