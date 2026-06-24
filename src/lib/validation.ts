import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalDate = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD).")
    .optional(),
);

const optionalMoney = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 1500 or 1500.00.")
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
    name: z.string().trim().min(1, "Trip name is required.").max(200),
    mainDestination: optionalText(200),
    startDate: optionalDate,
    endDate: optionalDate,
    homeCurrency: z.preprocess(
      (v) =>
        typeof v === "string" && v.trim() !== "" ? v.trim().toUpperCase() : "EUR",
      z.string().length(3, "Use a 3-letter currency code (e.g. EUR)."),
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
    message: "End date can't be before the start date.",
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
    city: z.string().trim().min(1, "City is required.").max(200),
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
    { message: "Departure can't be before arrival.", path: ["departureDate"] },
  );

export type StopInput = z.infer<typeof stopInputSchema>;

export const inviteInputSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
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
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker (YYYY-MM-DD).");
const moneyRequired = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter an amount like 42 or 42.00.");
const currencyCode = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
  z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code."),
);
const optionalRate = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^\d+(\.\d+)?$/, "Enter a valid rate.").optional(),
);
const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().regex(/^https?:\/\/.+/i, "Enter a valid URL.").optional(),
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
    message: "Amount must be greater than 0.",
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
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Use the date & time picker.")
    .optional(),
);
const optionalCurrency = z.preprocess(
  (v) => (typeof v === "string" && v.trim() !== "" ? v.trim().toUpperCase() : undefined),
  z.string().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code.").optional(),
);

export const itineraryInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required.").max(200),
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
    message: "End must be after start.",
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
    title: z.string().trim().min(1, "Title is required.").max(200),
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
    message: "End must be after start.",
    path: ["endAt"],
  });

export type DocumentInput = z.infer<typeof documentInputSchema>;
