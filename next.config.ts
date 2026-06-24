import type { NextConfig } from "next";

// Server Actions enforce a CSRF check that the request's `Origin` matches the
// `Host` / `X-Forwarded-Host` header. Behind a reverse proxy or port-forward
// (e.g. GitHub Codespaces or a cloud preview URL) those differ, and Next
// rejects the action with "Invalid Server Actions request."
const envOrigins =
  process.env.ALLOWED_SERVER_ACTION_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

// In development, always trust GitHub Codespaces forwarded hosts so the app
// works through the port-forward with no extra setup. Not applied in production.
const devOrigins =
  process.env.NODE_ENV !== "production" ? ["*.app.github.dev"] : [];

const allowedOrigins = [...devOrigins, ...envOrigins];

const nextConfig: NextConfig = {
  ...(allowedOrigins.length
    ? { experimental: { serverActions: { allowedOrigins } } }
    : {}),
};

export default nextConfig;
