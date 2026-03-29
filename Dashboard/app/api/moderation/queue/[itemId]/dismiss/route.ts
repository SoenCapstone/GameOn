import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { dismissModerationQueueItem } from "@/lib/moderation";

export async function POST(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { itemId } = await context.params;

  if (!itemId) {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 });
  }

  try {
    const queue = await dismissModerationQueueItem(itemId);

    return NextResponse.json({ ok: true, queue });
  } catch (error) {
    console.error("Failed to dismiss moderation queue item", error);

    return NextResponse.json(
      { error: "Failed to dismiss moderation queue item" },
      { status: 500 },
    );
  }
}
