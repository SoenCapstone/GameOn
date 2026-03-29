import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalLeagues } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalLeagues();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total leagues", error);
    return NextResponse.json(
      { error: "Failed to load total leagues" },
      { status: 500 },
    );
  }
}
