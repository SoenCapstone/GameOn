import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/auth";

export async function requireAdminApi() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const isAdminAccount = await isAdmin({ userId, sessionClaims });

  if (!isAdminAccount) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
  };
}
