import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalDate = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte die Datumsauswahl verwenden (JJJJ-MM-TT).")
    .optional(),
);

const optionalMoney = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Gib einen Betrag wie 1500 oder 1500,00 ein.")
    .optional(),
);

export const tripStatusValues = [
  "planning",
  "booked",
  "active",
  "completed",
  "archived",
] as const;

export const travelStyleValues = ["budget", "standard", "premium"] as const;

export const tripInputSchema = z
  .object({
    name: z.string().trim().min(1, "Reisename ist erforderlich.").max(200),
    mainDestination: optionalText(200),
    startDate: optionalDate,
    endDate: optionalDate,
    homeCurrency: z.preprocess(
      (v) =>
        typeof v === "string" && v.trim() !== "" ? v.trim().toUpperCase() : "EUR",
      z.string().length(3, "Verwende einen 3-stelligen Währungscode (z. B. EUR)."),
    ),
    budget: optionalMoney,
    status: z.enum(tripStatusValues).default("planning"),
    travelStyle: z.preprocess(
      emptyToUndefined,
      z.enum(travelStyleValues).optional(),
    ),
    notes: optionalText(5000),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    path: ["endDate"],
  });

export type TripInput = z.infer<typeof tripInputSchema>;

const optionalLat = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(-90).max(90).optional(),
);
const optionalLng = z.preprocess(
  emptyToUndefined,
  z.coerce.number().min(-180).max(180).optional(),
);

export const stopInputSchema = z
  .object({
    city: z.string().trim().min(1, "Stadt ist erforderlich.").max(200),
    country: optionalText(120),
    arrivalDate: optionalDate,
    departureDate: optionalDate,
    accommodationName: optionalText(200),
    accommodationAddress: optionalText(300),
    lat: optionalLat,
    lng: optionalLng,
    notes: optionalText(5000),
  })
  .refine(
    (d) => !d.arrivalDate || !d.departureDate || d.departureDate >= d.arrivalDate,
    { message: "Die Abreise darf nicht vor der Ankunft liegen.", path: ["departureDate"] },
  );

export type StopInput = z.infer<typeof stopInputSchema>;

export const inviteInputSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Gib eine gültige E-Mail-Adresse ein."),
  ),
  role: z.enum(["editor", "viewer"]),
});

export type InviteInput = z.infer<typeof inviteInputSchema>;

export const expenseCategoryValues = [
  "flights",
  "accommodation",
  "food",
  "local_transport",
  "car_rental",
  "fuel",
  "activities",
  "shopping",
  "insurance",
  "fees",
  "other",
] as const;
export type ExpenseCategory = (typeof expenseCategoryValues)[number];

const requiredDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte die Datumsauswahl verwenden (JJJJ-MM-TT).");
const moneyRequired = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Gib einen Betrag wie 42 oder 42,00 ein.");
const currencyCode = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
  z.string().regex(/^[A-Z]{3}$/, "Verwende einen 3-stelligen Währungscode."),
);
const optionalRate = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d+(\.\d+)?$/, "Gib einen gültigen Kurs ein.").optional(),
);
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^https?:\/\/.+/i, "Gib eine gültige URL ein.").optional(),
);

export const expenseInputSchema = z
  .object({
    stopId: z.preprocess(emptyToUndefined, z.string().optional()),
    date: requiredDate,
    category: z.enum(expenseCategoryValues),
    amount: moneyRequired,
    currency: currencyCode,
    manualRate: optionalRate,
    paymentMethod: optionalText(100),
    paidBy: z.preprocess(emptyToUndefined, z.string().optional()),
    splitWith: z.array(z.string()).optional().default([]),
    notes: optionalText(2000),
    receiptUrl: optionalUrl,
  })
  .refine((d) => Number(d.amount) > 0, {
    message: "Der Betrag muss größer als 0 sein.",
    path: ["amount"],
  });

export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export const itineraryItemTypeValues = [
  "flight",
  "hotel",
  "transport",
  "activity",
  "food",
  "custom",
] as const;

const optionalDateTime = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Bitte die Datums- und Zeitauswahl verwenden.")
    .optional(),
);
const optionalCurrency = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().toUpperCase() : undefined),
  z.string().regex(/^[A-Z]{3}$/, "Verwende einen 3-stelligen Währungscode.").optional(),
);

export const itineraryInputSchema = z
  .object({
    title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
    type: z.enum(itineraryItemTypeValues),
    stopId: z.preprocess(emptyToUndefined, z.string().optional()),
    startAt: optionalDateTime,
    endAt: optionalDateTime,
    location: optionalText(200),
    lat: optionalLat,
    lng: optionalLng,
    cost: optionalMoney,
    currency: optionalCurrency,
    notes: optionalText(2000),
  })
  .refine((d) => !d.startAt || !d.endAt || d.endAt >= d.startAt, {
    message: "Das Ende muss nach dem Beginn liegen.",
    path: ["endAt"],
  });

export type ItineraryInput = z.infer<typeof itineraryInputSchema>;

export const documentTypeValues = [
  "flight",
  "hotel",
  "train",
  "car_rental",
  "activity",
  "restaurant",
  "visa",
  "insurance",
  "other",
] as const;

export const documentInputSchema = z
  .object({
    type: z.enum(documentTypeValues),
    title: z.string().trim().min(1, "Titel ist erforderlich.").max(200),
    vendor: optionalText(160),
    bookingRef: optionalText(160),
    stopId: z.preprocess(emptyToUndefined, z.string().optional()),
    startAt: optionalDateTime,
    endAt: optionalDateTime,
    location: optionalText(200),
    price: optionalMoney,
    currency: optionalCurrency,
    notes: optionalText(2000),
    externalUrl: optionalUrl,
    // Populated by the client-side Drive upload (hidden fields).
    driveFileId: z.preprocess(emptyToUndefined, z.string().optional()),
    driveFileUrl: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .refine((d) => !d.startAt || !d.endAt || d.endAt >= d.startAt, {
    message: "Das Ende muss nach dem Beginn liegen.",
    path: ["endAt"],
  });

export type DocumentInput = z.infer<typeof documentInputSchema>;

export const spotCategoryValues = [
  "sightseeing",
  "restaurant",
  "cafe",
  "bar",
  "museum",
  "nature",
  "shopping",
  "nightlife",
  "hidden_gem",
  "family_friendly",
  "rainy_day",
] as const;

// rating is numeric(2,1) in the DB → keep it a string for insertion.
const optionalRating = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^[0-5](\.\d)?$/, "Bewertung zwischen 0 und 5 (z. B. 4 oder 4.5).")
    .optional(),
);
const optionalDuration = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number()
    .int("Gib volle Minuten ein.")
    .min(0)
    .max(100000)
    .optional(),
);

export const spotInputSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(200),
  category: z.preprocess(emptyToUndefined, z.enum(spotCategoryValues).optional()),
  stopId: z.preprocess(emptyToUndefined, z.string().optional()),
  address: optionalText(300),
  lat: optionalLat,
  lng: optionalLng,
  rating: optionalRating,
  source: optionalText(200),
  recommendedDurationMinutes: optionalDuration,
  notes: optionalText(2000),
});

export type SpotInput = z.infer<typeof spotInputSchema>;
