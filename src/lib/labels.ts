// German display labels for the enum values stored in the database. The stored
// values stay in English (DB/validation unchanged); these map them to the text
// shown in the UI. Unknown values fall back to the raw value.

export const tripStatusLabels: Record<string, string> = {
  planning: "Planung",
  booked: "Gebucht",
  active: "Aktiv",
  completed: "Abgeschlossen",
  archived: "Archiviert",
};

export const travelStyleLabels: Record<string, string> = {
  budget: "Sparsam",
  standard: "Standard",
  premium: "Premium",
};

export const memberRoleLabels: Record<string, string> = {
  owner: "Eigentümer",
  editor: "Bearbeiter",
  viewer: "Betrachter",
};

export const invitationStatusLabels: Record<string, string> = {
  pending: "Ausstehend",
  accepted: "Angenommen",
  declined: "Abgelehnt",
};

export const documentTypeLabels: Record<string, string> = {
  flight: "Flug",
  hotel: "Hotel",
  train: "Zug",
  car_rental: "Mietwagen",
  activity: "Aktivität",
  restaurant: "Restaurant",
  visa: "Visum",
  insurance: "Versicherung",
  other: "Sonstiges",
};

export const itineraryItemTypeLabels: Record<string, string> = {
  flight: "Flug",
  hotel: "Hotel",
  transport: "Transport",
  activity: "Aktivität",
  food: "Essen",
  custom: "Sonstiges",
};

export const spotCategoryLabels: Record<string, string> = {
  sightseeing: "Sehenswürdigkeit",
  restaurant: "Restaurant",
  cafe: "Café",
  bar: "Bar",
  museum: "Museum",
  nature: "Natur",
  shopping: "Einkaufen",
  nightlife: "Nachtleben",
  hidden_gem: "Geheimtipp",
  family_friendly: "Familienfreundlich",
  rainy_day: "Schlechtwetter",
};

export const expenseCategoryLabels: Record<string, string> = {
  flights: "Flüge",
  accommodation: "Unterkunft",
  food: "Essen",
  local_transport: "Nahverkehr",
  car_rental: "Mietwagen",
  fuel: "Kraftstoff",
  activities: "Aktivitäten",
  shopping: "Einkaufen",
  insurance: "Versicherung",
  fees: "Gebühren",
  other: "Sonstiges",
};

export const cabinClassLabels: Record<string, string> = {
  economy: "Economy",
  "premium-economy": "Premium Economy",
  business: "Business",
  first: "First",
};

/** Look up a German label, falling back to the raw value. */
export function labelFor(
  map: Record<string, string>,
  value: string | null | undefined,
): string {
  if (!value) return "";
  return map[value] ?? value;
}
