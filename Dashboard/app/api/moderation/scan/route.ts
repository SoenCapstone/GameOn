import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { runModerationScanNow } from "@/lib/moderation-scheduler";

export async function POST() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const result = await runModerationScanNow();

    if (!result) {
      return NextResponse.json(
        { error: "Failed to run moderation scan right now" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to scan moderation content", error);

    return NextResponse.json(
      { error: "Failed to scan moderation content" },
      { status: 500 },
    );
  }
}
