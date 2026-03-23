import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getModerationQueueItems } from "@/lib/moderation";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const queue = await getModerationQueueItems();

    return NextResponse.json({ queue });
  } catch (error) {
    console.error("Failed to load moderation queue", error);

    return NextResponse.json(
      { error: "Failed to load moderation queue" },
      { status: 500 },
    );
  }
}
