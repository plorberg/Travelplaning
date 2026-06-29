"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/trips/actions";
import { documentTypeValues } from "@/lib/validation";
import { documentTypeLabels } from "@/lib/labels";
import { uploadToTripDrive, type DriveUpload } from "@/lib/drive/client";
import {
  extractDocumentFields,
  type ParsedDocFields,
} from "@/lib/documents/extract-fields";

type Defaults = {
  type?: string;
  title?: string;
  vendor?: string;
  bookingRef?: string;
  stopId?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  price?: string;
  currency?: string;
  notes?: string;
  externalUrl?: string;
  driveFileId?: string;
  driveFileUrl?: string;
};

// Extracts plain text from a PDF in the browser (pdf.js loaded on demand).
async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ") + "\n";
  }
  return text;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{label}</span>
      {children}
      {error?.length ? (
        <span style={{ color: "crimson", fontSize: "0.8rem" }}>{error[0]}</span>
      ) : null}
    </label>
  );
}

export function DocumentForm({
  action,
  defaults = {},
  submitLabel,
  stops,
  tripId,
  tripName,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
  stops: { id: string; city: string }[];
  tripId: string;
  tripName: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const [drive, setDrive] = useState<DriveUpload | null>(
    defaults.driveFileId && defaults.driveFileUrl
      ? { id: defaults.driveFileId, url: defaults.driveFileUrl, name: "angehängte Datei" }
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedCount, setParsedCount] = useState(0);
  const fe = state.fieldErrors ?? {};

  // Fields the PDF reader can fill — controlled so they can be set on parse.
  const [bookingRef, setBookingRef] = useState(defaults.bookingRef ?? "");
  const [startAt, setStartAt] = useState(defaults.startAt ?? "");
  const [endAt, setEndAt] = useState(defaults.endAt ?? "");
  const [price, setPrice] = useState(defaults.price ?? "");
  const [currency, setCurrency] = useState(defaults.currency ?? "");

  // Only fill empty fields, so parsing never clobbers what the user typed.
  function applyParsed(p: ParsedDocFields) {
    let n = 0;
    if (p.bookingRef && !bookingRef) { setBookingRef(p.bookingRef); n++; }
    if (p.price && !price) { setPrice(p.price); n++; }
    if (p.currency && !currency) { setCurrency(p.currency); n++; }
    if (p.startAt && !startAt) { setStartAt(`${p.startAt}T00:00`); n++; }
    if (p.endAt && !endAt) { setEndAt(`${p.endAt}T00:00`); n++; }
    if (n) setParsedCount(n);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1) Read data from the PDF locally (no upload, stays in the browser).
    if (file.type === "application/pdf") {
      setParsing(true);
      setParsedCount(0);
      try {
        applyParsed(extractDocumentFields(await extractPdfText(file)));
      } catch {
        // Ignore — extraction is best-effort; the user can fill fields manually.
      } finally {
        setParsing(false);
      }
    }

    // 2) Upload to the signed-in user's Drive.
    setUploading(true);
    setUploadError(null);
    try {
      setDrive(await uploadToTripDrive({ tripId, tripName, file }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Typ" error={fe.type}>
          <select name="type" defaultValue={defaults.type ?? "flight"}>
            {documentTypeValues.map((t) => (
              <option key={t} value={t}>
                {documentTypeLabels[t] ?? t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Titel" error={fe.title}>
          <input name="title" defaultValue={defaults.title ?? ""} required />
        </Field>
      </div>

      <div
        style={{
          display: "grid",
          gap: "0.35rem",
          padding: "0.6rem 0.75rem",
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      >
        <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Datei (Google Drive) — PDFs werden ausgelesen
        </span>
        <input type="file" accept="application/pdf,*/*" onChange={onFile} disabled={uploading || parsing} />
        {parsing ? <span style={{ fontSize: "0.8rem" }}>PDF wird gelesen…</span> : null}
        {parsedCount > 0 ? (
          <span style={{ color: "green", fontSize: "0.8rem" }}>
            🔎 {parsedCount} Feld(er) aus dem PDF übernommen — bitte prüfen.
          </span>
        ) : null}
        {uploading ? <span style={{ fontSize: "0.8rem" }}>Wird zu Drive hochgeladen…</span> : null}
        {drive ? (
          <span style={{ color: "green", fontSize: "0.85rem" }}>
            Angehängt:{" "}
            <a href={drive.url} target="_blank" rel="noreferrer">
              {drive.name} ↗
            </a>
          </span>
        ) : null}
        {uploadError ? (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>{uploadError}</span>
        ) : null}
        <input type="hidden" name="driveFileId" value={drive?.id ?? ""} />
        <input type="hidden" name="driveFileUrl" value={drive?.url ?? ""} />
      </div>

      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Anbieter" error={fe.vendor}>
          <input name="vendor" defaultValue={defaults.vendor ?? ""} />
        </Field>
        <Field label="Buchungsnummer" error={fe.bookingRef}>
          <input name="bookingRef" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
        </Field>
      </div>
      <Field label="Station" error={fe.stopId}>
        <select name="stopId" defaultValue={defaults.stopId ?? ""}>
          <option value="">— keine —</option>
          {stops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.city}
            </option>
          ))}
        </select>
      </Field>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Beginn" error={fe.startAt}>
          <input type="datetime-local" name="startAt" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </Field>
        <Field label="Ende" error={fe.endAt}>
          <input type="datetime-local" name="endAt" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Ort" error={fe.location}>
        <input name="location" defaultValue={defaults.location ?? ""} />
      </Field>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Preis" error={fe.price}>
          <input name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Währung" error={fe.currency}>
          <input name="currency" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: 80 }} />
        </Field>
      </div>
      <Field label="Externer Link (optional)" error={fe.externalUrl}>
        <input name="externalUrl" inputMode="url" defaultValue={defaults.externalUrl ?? ""} />
      </Field>
      <Field label="Notizen" error={fe.notes}>
        <textarea name="notes" rows={3} defaultValue={defaults.notes ?? ""} />
      </Field>

      {state.error ? <p style={{ color: "crimson" }}>{state.error}</p> : null}
      <button type="submit" className="btn-primary" disabled={pending || uploading} style={{ padding: "0.5rem 1rem" }}>
        {pending ? "Wird gespeichert…" : submitLabel}
      </button>
    </form>
  );
}
