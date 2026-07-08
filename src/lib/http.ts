// fetch with a hard timeout for external APIs (Nominatim, Overpass, OSRM,
// Wikivoyage, Frankfurter). Without one, a hanging upstream blocks the server
// action — and the user's form — indefinitely.
export function fetchWithTimeout(
  url: string,
  init: RequestInit & { next?: { revalidate?: number } } = {},
  timeoutMs = 8000,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
