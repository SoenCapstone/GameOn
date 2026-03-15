import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getUsers } from "@/lib/users";

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

export async function GET(request: Request) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { searchParams } = new URL(request.url);

  try {
    const result = await getUsers({
      limit: parsePositiveInteger(searchParams.get("limit")),
      offset: parsePositiveInteger(searchParams.get("offset")),
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to load users", error);

    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    );
  }
}
