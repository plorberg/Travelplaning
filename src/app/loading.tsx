export default function Loading() {
  return (
    <main
      style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}
      aria-busy="true"
      aria-label="Wird geladen"
    >
      <div className="skeleton" style={{ height: 28, width: "45%", marginBottom: "1.25rem" }} />
      <div style={{ display: "grid", gap: "0.6rem" }}>
        <div className="skeleton" style={{ height: 16, width: "100%" }} />
        <div className="skeleton" style={{ height: 16, width: "85%" }} />
        <div className="skeleton" style={{ height: 16, width: "70%" }} />
      </div>
    </main>
  );
}
