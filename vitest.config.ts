import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Mirror the "@/* -> src/*" path alias from tsconfig so tests can import
// modules that use it (e.g. runtime value imports from @/lib/...).
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
