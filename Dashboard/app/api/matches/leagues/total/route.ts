import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalLeagueMatches } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalLeagueMatches();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total league matches", error);
    return NextResponse.json(
      { error: "Failed to load total league matches" },
      { status: 500 },
    );
  }
}
