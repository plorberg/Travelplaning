import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listItinerary } from "@/lib/itinerary";
import { buildItineraryIcs } from "@/lib/ics";

// Downloads the itinerary as an iCalendar file so it can be imported into
// phone/desktop calendars. Same auth chain as the itinerary page.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) return new Response("Not found", { status: 404 });

  const items = await listItinerary(user.id, tripId);
  const ics = buildItineraryIcs(trip.name, items);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // Static ASCII filename: trip names may contain characters that are
      // unsafe in headers.
      "Content-Disposition": 'attachment; filename="reiseplan.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
