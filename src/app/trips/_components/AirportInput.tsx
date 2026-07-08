"use client";

import { useId, useRef, useState } from "react";

type Airport = {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
};

const display = (a: Airport) => `${a.city ?? a.name} (${a.code})`;

export function AirportInput({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder?: string;
  onSelect: (code: string) => void;
}) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(false);
  const [active, setActive] = useState(-1); // keyboard-highlighted option
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();

  function onType(v: string) {
    setText(v);
    setPicked(false);
    setActive(-1);
    onSelect(""); // not a confirmed airport until one is picked
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(v.trim())}`);
        if (res.ok) {
          setResults(await res.json());
          setOpen(true);
        }
      } catch {
        // ignore — network/offline; the field just won't autocomplete
      }
    }, 200);
  }

  function pick(a: Airport) {
    setText(display(a));
    setPicked(true);
    onSelect(a.code);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (active >= 0 && active < results.length) {
        e.preventDefault();
        pick(results[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <label style={{ display: "grid", gap: "0.25rem", position: "relative" }}>
      <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{label}</span>
      <input
        value={text}
        onChange={(e) => onType(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      />
      {!picked && text.trim().length >= 2 && !open ? (
        <span style={{ fontSize: "0.75rem", color: "var(--warning)" }}>
          Bitte einen Flughafen aus der Liste wählen.
        </span>
      ) : null}
      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 5,
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "var(--shadow)",
          }}
        >
          {results.map((a, i) => (
            <li
              key={a.code}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
            >
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus / beat the blur
                  pick(a);
                }}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: i === active ? "var(--hover)" : "none",
                  borderRadius: 0,
                  padding: "0.4rem 0.6rem",
                }}
              >
                <strong>{a.code}</strong> · {a.city ?? a.name}
                <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                  {" "}
                  — {a.name}
                  {a.country ? `, ${a.country}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}
