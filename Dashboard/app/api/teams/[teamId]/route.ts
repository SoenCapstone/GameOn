import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { archiveTeam } from "@/lib/teams";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { teamId } = await context.params;

  try {
    await archiveTeam(teamId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete team",
      },
      { status: 400 },
    );
  }
}
