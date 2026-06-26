// Seeds the `airports` reference table from the public-domain OurAirports
// dataset (large + medium airports that have an IATA code). Idempotent:
// re-running upserts. Usage: `npm run db:seed:airports`
// (uses DATABASE_URL from the env, falling back to .env.local).
import { readFileSync } from "node:fs";

function dbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const m = readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const url = dbUrl();
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

await sql`CREATE TABLE IF NOT EXISTS airports (
  code text PRIMARY KEY, name text NOT NULL, city text, country text,
  lat double precision, lng double precision
)`;

console.log("Fetching OurAirports dataset…");
const res = await fetch("https://davidmegginson.github.io/ourairports-data/airports.csv");
if (!res.ok) { console.error("Download failed:", res.status); process.exit(1); }
const lines = (await res.text()).split(/\r?\n/);
const header = parseCsvLine(lines[0]);
const col = (n) => header.indexOf(n);
const [iType, iName, iLat, iLng, iCountry, iCity, iIata] = [
  "type", "name", "latitude_deg", "longitude_deg", "iso_country", "municipality", "iata_code",
].map(col);

const rows = [];
const seen = new Set();
for (let k = 1; k < lines.length; k++) {
  if (!lines[k]) continue;
  const c = parseCsvLine(lines[k]);
  const code = (c[iIata] || "").toUpperCase();
  if (!/^[A-Z]{3}$/.test(code) || seen.has(code)) continue;
  const type = c[iType];
  if (type !== "large_airport" && type !== "medium_airport") continue;
  seen.add(code);
  const lat = Number(c[iLat]);
  const lng = Number(c[iLng]);
  rows.push([
    code, c[iName] || code, c[iCity] || null, c[iCountry] || null,
    Number.isFinite(lat) ? lat : null, Number.isFinite(lng) ? lng : null,
  ]);
}
console.log(`Seeding ${rows.length} airports…`);

const BATCH = 400;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const ph = batch
    .map((_, j) => `($${j * 6 + 1},$${j * 6 + 2},$${j * 6 + 3},$${j * 6 + 4},$${j * 6 + 5},$${j * 6 + 6})`)
    .join(",");
  await sql.query(
    `INSERT INTO airports (code,name,city,country,lat,lng) VALUES ${ph}
     ON CONFLICT (code) DO UPDATE SET
       name=EXCLUDED.name, city=EXCLUDED.city, country=EXCLUDED.country,
       lat=EXCLUDED.lat, lng=EXCLUDED.lng`,
    batch.flat(),
  );
  process.stdout.write(`\r  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
}
console.log("\nDone.");
