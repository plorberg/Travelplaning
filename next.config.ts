import type { NextConfig } from "next";

// Server Actions enforce a CSRF check that the request's `Origin` matches the
// `Host` / `X-Forwarded-Host` header. Behind a reverse proxy or port-forward
// (e.g. GitHub Codespaces or a cloud preview URL) those differ, so the external
// origin must be allow-listed or Next rejects the action with
// "Invalid Server Actions request." (error E80).
//
// IMPORTANT: next.config.ts is read ONLY at server startup and is NOT
// hot-reloaded — restart `next dev` after changing this file.

// Extra origins from the environment (comma-separated), for any host.
const envOrigins =
  process.env.ALLOWED_SERVER_ACTION_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

// In development, trust both sides of the Codespaces port-forward:
//  - The public host: `<name>-<port>.app.github.dev`. `**` matches any
//    subdomain depth, covering the `*.preview.app.github.dev` variant too.
//  - `localhost:<port>`: when the port is opened through VS Code's forwarded
//    port, the browser sends `Origin: http://localhost:<port>` while the tunnel
//    injects `x-forwarded-host: <name>-<port>.app.github.dev`. Those differ, so
//    the localhost origin must be allow-listed or the action is rejected (E80).
const codespaceDomain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN;
const devPort = process.env.PORT ?? "3000";
const devOrigins =
  process.env.NODE_ENV !== "production"
    ? [
        ...(codespaceDomain ? [`**.${codespaceDomain}`] : []),
        "**.app.github.dev",
        "**.githubpreview.dev",
        `localhost:${devPort}`,
        `127.0.0.1:${devPort}`,
      ]
    : [];

const allowedOrigins = [...new Set([...devOrigins, ...envOrigins])];

const nextConfig: NextConfig = {
  // firebase-admin has dynamic requires that Vercel's serverless bundler can
  // miss, which crashes the function at cold start (HTTP 500 on every route
  // that verifies the session). Load it from node_modules at runtime instead.
  serverExternalPackages: ["firebase-admin"],
  ...(allowedOrigins.length
    ? { experimental: { serverActions: { allowedOrigins } } }
    : {}),
};

export default nextConfig;
