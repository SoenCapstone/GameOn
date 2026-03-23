import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { lockModeratedUser } from "@/lib/moderation";

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
    const result = await lockModeratedUser(itemId);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Failed to lock moderated user", error);

    const message =
      error instanceof Error ? error.message : "Failed to lock moderated user";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
