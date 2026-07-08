"use client";

import { useOptimistic, useRef, useTransition } from "react";
import {
  addPackingItemAction,
  deletePackingItemAction,
  togglePackingItemAction,
} from "@/app/trips/packing-actions";

export type PackingItem = {
  id: string;
  name: string;
  category: string | null;
  done: boolean;
};

type Change =
  | { type: "toggle"; id: string }
  | { type: "add"; item: PackingItem }
  | { type: "remove"; id: string };

const SUGGESTED_CATEGORIES = [
  "Rucksack",
  "Koffer",
  "Handgepäck",
  "Kulturbeutel",
  "Kleidung",
  "Technik",
  "Dokumente",
  "Reiseapotheke",
];

const UNCATEGORIZED = "Allgemein";

function reduce(state: PackingItem[], change: Change): PackingItem[] {
  switch (change.type) {
    case "toggle":
      return state.map((i) => (i.id === change.id ? { ...i, done: !i.done } : i));
    case "add":
      return [...state, change.item];
    case "remove":
      return state.filter((i) => i.id !== change.id);
  }
}

// The whole list is optimistic: every interaction updates the UI immediately
// and syncs the server action in a background transition (a full round trip
// per click felt sluggish). When the server state comes back via revalidation,
// it replaces the optimistic state — a failed action simply reverts.
export function PackingList({
  tripId,
  items,
  canEdit,
}: {
  tripId: string;
  items: PackingItem[];
  canEdit: boolean;
}) {
  const [list, apply] = useOptimistic(items, reduce);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function toggle(id: string) {
    startTransition(async () => {
      apply({ type: "toggle", id });
      await togglePackingItemAction(tripId, id);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      apply({ type: "remove", id });
      await deletePackingItemAction(tripId, id);
    });
  }

  function add(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    if (!name) return;
    formRef.current?.reset();
    startTransition(async () => {
      apply({
        type: "add",
        item: {
          id: `optimistic-${Date.now()}`,
          name,
          category: category || null,
          done: false,
        },
      });
      await addPackingItemAction(tripId, formData);
    });
  }

  // Group by category: named categories alphabetically, "Allgemein" last.
  const groups = new Map<string, PackingItem[]>();
  for (const item of list) {
    const key = item.category?.trim() || UNCATEGORIZED;
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  const groupNames = [...groups.keys()].sort((a, b) => {
    if (a === UNCATEGORIZED) return 1;
    if (b === UNCATEGORIZED) return -1;
    return a.localeCompare(b, "de");
  });
  const categorySuggestions = [
    ...new Set([...groupNames.filter((g) => g !== UNCATEGORIZED), ...SUGGESTED_CATEGORIES]),
  ];

  const open = list.filter((i) => !i.done).length;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <p style={{ color: "var(--muted)", margin: 0 }}>
        {list.length === 0
          ? "Noch keine Einträge."
          : open === 0
            ? `Alles gepackt — ${list.length} ${list.length === 1 ? "Eintrag" : "Einträge"} ✅`
            : `${open} von ${list.length} noch offen`}
      </p>

      {canEdit ? (
        <form
          ref={formRef}
          action={add}
          className="field-row"
          style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}
        >
          <label style={{ display: "grid", gap: "0.25rem", flex: 2, minWidth: 160 }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Eintrag</span>
            <input name="name" placeholder="z. B. Reisepass, Ladekabel…" maxLength={200} required />
          </label>
          <label style={{ display: "grid", gap: "0.25rem", flex: 1, minWidth: 130 }}>
            <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>Kategorie (optional)</span>
            <input name="category" list="packing-categories" placeholder="z. B. Koffer" maxLength={100} />
          </label>
          <datalist id="packing-categories">
            {categorySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <button type="submit" className="btn-primary">Hinzufügen</button>
        </form>
      ) : null}

      {groupNames.map((groupName) => {
        const groupItems = groups.get(groupName)!;
        const groupOpen = groupItems.filter((i) => !i.done).length;
        return (
          <section key={groupName}>
            <h2 style={{ fontSize: "0.95rem", margin: "0 0 0.4rem", display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
              {groupName}
              <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--muted)" }}>
                {groupItems.length - groupOpen}/{groupItems.length} gepackt
              </span>
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.4rem" }}>
              {groupItems.map((item) => (
                <li
                  key={item.id}
                  className="card list-row"
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.75rem" }}
                >
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      aria-label={item.done ? `„${item.name}" als offen markieren` : `„${item.name}" abhaken`}
                      style={{ padding: "0.2rem 0.5rem", lineHeight: 1 }}
                    >
                      {item.done ? "☑" : "☐"}
                    </button>
                  ) : (
                    <span aria-hidden="true">{item.done ? "☑" : "☐"}</span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      textDecoration: item.done ? "line-through" : "none",
                      color: item.done ? "var(--muted)" : "inherit",
                    }}
                  >
                    {item.name}
                  </span>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={`„${item.name}" entfernen`}
                      style={{ padding: "0.2rem 0.5rem", lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
