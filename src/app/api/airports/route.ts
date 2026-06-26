import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchAirports } from "@/lib/airports";

// Autocomplete for the flight search. Requires a session (used on an
// authenticated page); returns public airport reference data.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json(await searchAirports(q));
}
