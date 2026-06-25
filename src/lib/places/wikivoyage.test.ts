import { describe, it, expect } from "vitest";
import {
  parseWikivoyageListings,
  splitTopLevel,
  stripWiki,
} from "./wikivoyage";

describe("splitTopLevel", () => {
  it("ignores separators inside {{ }} and [[ ]]", () => {
    expect(splitTopLevel("a|b|c", "|")).toEqual(["a", "b", "c"]);
    expect(splitTopLevel("see|name=X{{n=|y}}|lat=1", "|")).toEqual([
      "see",
      "name=X{{n=|y}}",
      "lat=1",
    ]);
    expect(splitTopLevel("name=[[A|B]]|address=C", "|")).toEqual([
      "name=[[A|B]]",
      "address=C",
    ]);
  });
});

describe("stripWiki", () => {
  it("removes links, markup and tags", () => {
    expect(stripWiki("'''Bold''' and [[Page|text]]")).toBe("Bold and text");
    expect(stripWiki("[https://x.com Visit] now")).toBe("Visit now");
    expect(stripWiki("Plain [[Link]]")).toBe("Plain Link");
  });
});

describe("parseWikivoyageListings", () => {
  const wikitext = `
Intro paragraph.
* {{see | name=Sky Tower | address=Victoria St | lat=-36.8485 | long=174.7633 | content=Tallest tower in the [[Southern Hemisphere]]. }}
* {{eat | name=The Grove | address=St Patricks Sq | content=Fine dining. }}
* {{listing | type=buy | name=Queen Street Shops }}
* {{vCard | type=eat | name=Depot | comment=Seafood near the wharf. }}
* {{vCard | type=sleep | name=Some Hotel }}
* {{see | address=No name here }}
{{climate}}
`;

  it("extracts listings (incl. vCard), maps categories, skips sleep/go", () => {
    const out = parseWikivoyageListings(wikitext);
    expect(out.map((r) => r.name)).toEqual([
      "Sky Tower",
      "The Grove",
      "Queen Street Shops",
      "Depot", // vCard type=eat
      // "Some Hotel" (vCard type=sleep) is skipped
    ]);
    expect(out.find((r) => r.name === "Depot")!.category).toBe("restaurant");
    expect(out.some((r) => r.name === "Some Hotel")).toBe(false);
    const sky = out[0];
    expect(sky).toMatchObject({
      name: "Sky Tower",
      category: "sightseeing",
      lat: -36.8485,
      lng: 174.7633,
      source: "Wikivoyage",
    });
    expect(sky.note).toContain("Tallest tower in the Southern Hemisphere");
  });

  it("maps generic listing via its type and tolerates missing coords", () => {
    const out = parseWikivoyageListings(wikitext);
    const shop = out.find((r) => r.name === "Queen Street Shops")!;
    expect(shop.category).toBe("shopping");
    expect(shop.lat).toBeUndefined();
  });

  it("respects the limit", () => {
    expect(parseWikivoyageListings(wikitext, 1)).toHaveLength(1);
  });
});
