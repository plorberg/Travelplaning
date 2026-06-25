import type { SpotCategory } from "@/lib/validation";

export type PlaceResult = {
  /** Stable id for React keys (e.g. "node/123"). */
  id: string;
  name: string;
  address: string;
  /** Coordinates may be absent (e.g. some Wikivoyage listings). */
  lat?: number;
  lng?: number;
  /** Best-effort mapping to our spot categories; undefined if unknown. */
  category?: SpotCategory;
  /** Short description, used to prefill notes (e.g. Wikivoyage content). */
  note?: string;
  /** Attribution source, e.g. "OpenStreetMap" or "Wikivoyage". */
  source: string;
};

export interface PlacesProvider {
  readonly name: string;
  search(
    query: string,
    opts?: { limit?: number; lang?: string },
  ): Promise<PlaceResult[]>;
}
