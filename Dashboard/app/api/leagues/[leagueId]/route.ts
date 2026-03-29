import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { archiveLeague } from "@/lib/leagues";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ leagueId: string }> },
) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { leagueId } = await context.params;

  try {
    await archiveLeague(leagueId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete league",
      },
      { status: 400 },
    );
  }
}
