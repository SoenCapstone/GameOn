import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalMatches } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalMatches();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total matches", error);
    return NextResponse.json(
      { error: "Failed to load total matches" },
      { status: 500 },
    );
  }
}
