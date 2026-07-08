import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center" }}>
      <h1>Seite nicht gefunden</h1>
      <p style={{ color: "var(--muted)" }}>
        Diese Seite existiert nicht oder du hast keinen Zugriff darauf.
      </p>
      <Link href="/dashboard" className="btn btn-primary">
        Zum Dashboard
      </Link>
    </main>
  );
}
