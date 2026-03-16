import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getUserOptions } from "@/lib/users";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const users = await getUserOptions();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to load user options", error);

    return NextResponse.json(
      { error: "Failed to load user options" },
      { status: 500 },
    );
  }
}
