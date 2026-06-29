import { formatMoney } from "@/lib/format";

/** Spent-vs-budget progress bar (server component). */
export function BudgetBar({
  spent,
  budget,
  currency,
  compact = false,
}: {
  spent: number;
  budget: number | null;
  currency: string;
  compact?: boolean;
}) {
  if (budget == null || budget <= 0) {
    if (compact) return null;
    return (
      <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Ausgegeben: {formatMoney(spent, currency)} · kein Budget gesetzt
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, (spent / budget) * 100));
  const over = spent > budget;
  const remaining = budget - spent;
  const barColor = over ? "var(--danger)" : pct > 85 ? "#b45309" : "var(--primary)";

  return (
    <div style={{ display: "grid", gap: "0.3rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.5rem",
          flexWrap: "wrap",
          fontSize: compact ? "0.8rem" : "0.9rem",
        }}
      >
        <span>
          <strong>{formatMoney(spent, currency)}</strong> von{" "}
          {formatMoney(budget, currency)}
        </span>
        <span style={{ color: over ? "var(--danger)" : "var(--muted)" }}>
          {over
            ? `${formatMoney(Math.abs(remaining), currency)} über Budget`
            : `${formatMoney(remaining, currency)} übrig`}
        </span>
      </div>
      <div
        style={{
          height: compact ? 6 : 9,
          background: "var(--border)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 999 }} />
      </div>
    </div>
  );
}
