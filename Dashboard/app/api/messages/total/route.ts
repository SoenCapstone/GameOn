import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalMessages } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalMessages();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total messages", error);
    return NextResponse.json(
      { error: "Failed to load total messages" },
      { status: 500 },
    );
  }
}
