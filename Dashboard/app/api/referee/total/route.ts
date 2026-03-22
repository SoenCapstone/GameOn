import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalRefereeProfiles } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalRefereeProfiles();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total referee profiles", error);
    return NextResponse.json(
      { error: "Failed to load total referee profiles" },
      { status: 500 },
    );
  }
}
