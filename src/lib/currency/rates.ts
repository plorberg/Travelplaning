import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { exchangeRates } from "@/db/schema";
import { getCurrencyProvider } from "./index";
import type { RateResult } from "./provider";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Resolve an exchange rate for `from`→`to`. A manual override wins; otherwise a
 * recently cached rate is reused, falling back to the configured provider and
 * caching the result (with source + timestamp).
 */
export async function resolveRate(params: {
  from: string;
  to: string;
  manualRate?: string;
}): Promise<RateResult> {
  const from = params.from.toUpperCase();
  const to = params.to.toUpperCase();

  if (params.manualRate) {
    return { rate: Number(params.manualRate), source: "manual", fetchedAt: new Date() };
  }
  if (from === to) {
    return { rate: 1, source: "identity", fetchedAt: new Date() };
  }

  const provider = getCurrencyProvider();
  const since = new Date(Date.now() - CACHE_TTL_MS);
  const [cached] = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.baseCurrency, from),
        eq(exchangeRates.quoteCurrency, to),
        eq(exchangeRates.source, provider.name),
        gte(exchangeRates.fetchedAt, since),
      ),
    )
    .orderBy(desc(exchangeRates.fetchedAt))
    .limit(1);
  if (cached) {
    return { rate: Number(cached.rate), source: cached.source, fetchedAt: cached.fetchedAt };
  }

  const result = await provider.getRate(from, to);
  await db
    .insert(exchangeRates)
    .values({
      baseCurrency: from,
      quoteCurrency: to,
      rate: result.rate.toString(),
      source: result.source,
      fetchedAt: result.fetchedAt,
    })
    .onConflictDoNothing();
  return result;
}
