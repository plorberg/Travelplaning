"use client";

import { useEffect } from "react";

// Registers the offline service worker (production only — avoids caching dev
// chunks during local development / HMR).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
