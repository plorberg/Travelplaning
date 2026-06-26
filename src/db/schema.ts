import {
  pgTable,
  pgEnum,
  text,
  integer,
  numeric,
  doublePrecision,
  timestamp,
  date,
  uuid,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

/* ----------------------------------------------------------------------------
 * Users — a mirror of the Firebase auth user, keyed by Firebase UID. This is
 * the FK target for trip ownership and membership. Authentication itself is
 * handled by Firebase; rows are upserted here on sign-in.
 * ------------------------------------------------------------------------- */

export const users = pgTable("user", {
  id: text("id").primaryKey(), // Firebase UID
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

/* ----------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */

export const tripStatus = pgEnum("trip_status", [
  "planning",
  "booked",
  "active",
  "completed",
  "archived",
]);

export const travelStyle = pgEnum("travel_style", [
  "budget",
  "standard",
  "premium",
]);

export const memberRole = pgEnum("member_role", ["owner", "editor", "viewer"]);

export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "declined",
]);

export const documentType = pgEnum("document_type", [
  "flight",
  "hotel",
  "train",
  "car_rental",
  "activity",
  "restaurant",
  "visa",
  "insurance",
  "other",
]);

export const itineraryItemType = pgEnum("itinerary_item_type", [
  "flight",
  "hotel",
  "transport",
  "activity",
  "food",
  "custom",
]);

export const spotCategory = pgEnum("spot_category", [
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
]);

export const expenseCategory = pgEnum("expense_category", [
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
]);

/* ----------------------------------------------------------------------------
 * Trips and membership (membership is the authorization join table)
 * ------------------------------------------------------------------------- */

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  mainDestination: text("main_destination"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  homeCurrency: text("home_currency").notNull().default("EUR"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  status: tripStatus("status").notNull().default("planning"),
  travelStyle: travelStyle("travel_style"),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("trip_members_trip_user_unique").on(t.tripId, t.userId)],
);

export const tripInvitations = pgTable("trip_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: memberRole("role").notNull().default("editor"),
  status: invitationStatus("status").notNull().default("pending"),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

/* ----------------------------------------------------------------------------
 * Stops, spots, documents, itinerary, expenses, rates
 * ------------------------------------------------------------------------- */

export const stops = pgTable("stops", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  city: text("city").notNull(),
  country: text("country"),
  arrivalDate: date("arrival_date"),
  departureDate: date("departure_date"),
  accommodationName: text("accommodation_name"),
  accommodationAddress: text("accommodation_address"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const savedSpots = pgTable("saved_spots", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  stopId: uuid("stop_id").references(() => stops.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  category: spotCategory("category"),
  address: text("address"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  rating: numeric("rating", { precision: 2, scale: 1 }),
  source: text("source"),
  notes: text("notes"),
  recommendedDurationMinutes: integer("recommended_duration_minutes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  stopId: uuid("stop_id").references(() => stops.id, { onDelete: "set null" }),
  type: documentType("type").notNull(),
  title: text("title").notNull(),
  vendor: text("vendor"),
  bookingRef: text("booking_ref"),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  location: text("location"),
  price: numeric("price", { precision: 12, scale: 2 }),
  currency: text("currency"),
  notes: text("notes"),
  externalUrl: text("external_url"),
  driveFileId: text("drive_file_id"),
  driveFileUrl: text("drive_file_url"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const itineraryItems = pgTable("itinerary_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  stopId: uuid("stop_id").references(() => stops.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  type: itineraryItemType("type").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  location: text("location"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  savedSpotId: uuid("saved_spot_id").references(() => savedSpots.id, {
    onDelete: "set null",
  }),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  currency: text("currency"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  stopId: uuid("stop_id").references(() => stops.id, { onDelete: "set null" }),
  date: date("date").notNull(),
  category: expenseCategory("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  // Converted into the trip home currency, using the rate captured at creation.
  convertedAmount: numeric("converted_amount", { precision: 12, scale: 2 }),
  exchangeRateUsed: numeric("exchange_rate_used", { precision: 18, scale: 8 }),
  paymentMethod: text("payment_method"),
  paidBy: text("paid_by").references(() => users.id, { onDelete: "set null" }),
  splitWith: jsonb("split_with").$type<string[]>(),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    baseCurrency: text("base_currency").notNull(),
    quoteCurrency: text("quote_currency").notNull(),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("exchange_rates_base_quote_fetched_unique").on(
      t.baseCurrency,
      t.quoteCurrency,
      t.fetchedAt,
    ),
  ],
);

/* ----------------------------------------------------------------------------
 * Airports — reference data (IATA codes) for the flight-search autocomplete,
 * so the deep link can hand off real airport codes. Seeded from OurAirports.
 * ------------------------------------------------------------------------- */

export const airports = pgTable("airports", {
  code: text("code").primaryKey(), // IATA, uppercase
  name: text("name").notNull(),
  city: text("city"),
  country: text("country"), // ISO 3166-1 alpha-2
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
});
