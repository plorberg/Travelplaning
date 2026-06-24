import type { NextConfig } from "next";

// Server Actions enforce a CSRF check that the request's `Origin` matches the
// `Host` / `X-Forwarded-Host` header. Behind a reverse proxy or port-forward
// (e.g. a cloud preview URL) those differ, and Next rejects the action with
// "Invalid Server Actions request." Allow the proxied origin(s) via env:
// comma-separated host names, wildcards allowed (e.g. "*.preview.example.dev").
const allowedOrigins = process.env.ALLOWED_SERVER_ACTION_ORIGINS
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  ...(allowedOrigins?.length
    ? { experimental: { serverActions: { allowedOrigins } } }
    : {}),
};

export default nextConfig;
