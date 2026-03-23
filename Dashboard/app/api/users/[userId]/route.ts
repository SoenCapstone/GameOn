import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { deleteDashboardUser } from "@/lib/users";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { userId } = await context.params;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    await deleteDashboardUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete user", error);

    const clerkError = error as {
      status?: number;
      errors?: Array<{ longMessage?: string; message?: string }>;
      message?: string;
    };
    const message =
      clerkError.errors?.[0]?.longMessage ??
      clerkError.errors?.[0]?.message ??
      clerkError.message ??
      "Failed to delete user";
    const status =
      typeof clerkError.status === "number" &&
      clerkError.status >= 400 &&
      clerkError.status < 600
        ? clerkError.status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
