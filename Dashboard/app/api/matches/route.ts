import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getMatches } from "@/lib/matches";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const matches = await getMatches();

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Failed to load matches", error);

    return NextResponse.json(
      { error: "Failed to load matches" },
      { status: 500 },
    );
  }
}
