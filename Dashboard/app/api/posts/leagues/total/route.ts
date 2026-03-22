import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-api";
import { getTotalLeaguePosts } from "@/lib/metrics";

export async function GET() {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  try {
    const total = await getTotalLeaguePosts();
    return NextResponse.json({ total });
  } catch (error) {
    console.error("Failed to load total league posts", error);
    return NextResponse.json(
      { error: "Failed to load total league posts" },
      { status: 500 },
    );
  }
}
