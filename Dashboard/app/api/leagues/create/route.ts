import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { createLeague } from "@/lib/leagues";

type RequestBody = {
  ownerUserId?: string;
  name?: string;
  sport?: string;
  region?: string;
  location?: string;
  level?: "RECREATIONAL" | "COMPETITIVE" | "YOUTH" | "AMATEUR" | "PROFESSIONAL";
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
    const league = await createLeague({
      ownerUserId: body.ownerUserId ?? "",
      name: body.name ?? "",
      sport: body.sport ?? "",
      region: body.region,
      location: body.location,
      level: body.level,
      privacy: body.privacy,
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create league",
      },
      { status: 400 },
    );
  }
}
