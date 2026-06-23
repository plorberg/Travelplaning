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
