import { defineConfig } from "drizzle-kit";

// `generate` works offline from the schema; `migrate`/`push`/`studio` need a real DATABASE_URL.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/travelplaning",
  },
});
