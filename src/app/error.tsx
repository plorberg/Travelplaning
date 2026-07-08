"use client";

// Root error boundary: a friendly German fallback instead of Next's generic
// error screen. `reset()` re-renders the segment (retries data fetching).
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center" }}>
      <h1>Etwas ist schiefgelaufen</h1>
      <p style={{ color: "var(--muted)" }}>
        Das hat leider nicht geklappt. Bitte versuche es noch einmal — wenn das
        Problem bleibt, lade die Seite neu.
      </p>
      <button type="button" className="btn-primary" onClick={reset}>
        Erneut versuchen
      </button>
    </main>
  );
}
