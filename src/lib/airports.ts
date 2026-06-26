import { or, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import { airports } from "@/db/schema";

export type Airport = {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
};

/** Searches airports by IATA code (prefix), city or name. Public reference data. */
export async function searchAirports(query: string, limit = 8): Promise<Airport[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return db
    .select({
      code: airports.code,
      name: airports.name,
      city: airports.city,
      country: airports.country,
    })
    .from(airports)
    .where(
      or(
        ilike(airports.code, `${q}%`),
        ilike(airports.city, `%${q}%`),
        ilike(airports.name, `%${q}%`),
      ),
    )
    // Exact code match first, then by city.
    .orderBy(sql`(${airports.code} = ${q.toUpperCase()}) desc`, airports.city)
    .limit(limit);
}
