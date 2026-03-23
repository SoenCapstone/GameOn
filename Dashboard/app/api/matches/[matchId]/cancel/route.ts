import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { cancelMatch } from "@/lib/matches";

type RequestBody = {
  matchType?: "TEAM_MATCH" | "LEAGUE_MATCH";
};

export async function POST(
  request: Request,
  context: { params: Promise<{ matchId: string }> },
) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isAdmin({ userId, sessionClaims });

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.matchType) {
    return NextResponse.json({ error: "matchType is required" }, { status: 400 });
  }

  const { matchId } = await context.params;

  try {
    await cancelMatch({
      matchId,
      matchType: body.matchType,
      cancelledByUserId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel match",
      },
      { status: 400 },
    );
  }
}
