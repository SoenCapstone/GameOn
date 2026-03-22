import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalTeamMatches } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalTeamMatches();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total team matches", error);
    return NextResponse.json(
      { error: "Failed to load total team matches" },
      { status: 500 },
    );
  }
}
