import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { createTeam } from "@/lib/teams";

type RequestBody = {
  ownerUserId?: string;
  name?: string;
  sport?: string;
  scope?: string;
  location?: string;
  allowedRegions?: string[];
  privacy?: "PUBLIC" | "PRIVATE";
};

export async function POST(request: Request) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  let body: RequestBody;

  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const team = await createTeam({
      ownerUserId: body.ownerUserId ?? "",
      name: body.name ?? "",
      sport: body.sport ?? "",
      scope: body.scope,
      location: body.location ?? "",
      allowedRegions: body.allowedRegions ?? [],
      privacy: body.privacy,
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create team",
      },
      { status: 400 },
    );
  }
}
