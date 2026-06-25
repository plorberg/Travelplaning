import type { SpotCategory } from "@/lib/validation";

export type PlaceResult = {
  /** Stable id for React keys (e.g. "node/123"). */
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Best-effort mapping to our spot categories; undefined if unknown. */
  category?: SpotCategory;
  /** Attribution source, e.g. "OpenStreetMap". */
  source: string;
};

export interface PlacesProvider {
  readonly name: string;
  search(
    query: string,
    opts?: { limit?: number; lang?: string },
  ): Promise<PlaceResult[]>;
}
