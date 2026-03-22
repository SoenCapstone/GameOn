import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  createUserInvitation,
  DashboardUserAlreadyExistsError,
} from "@/lib/users";

export async function POST(request: Request) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const body = (await request.json().catch(() => null)) as {
    email?: string;
  } | null;

  const email = body?.email?.trim();

  if (!email) {
    return NextResponse.json(
      { error: "email is required" },
      { status: 400 },
    );
  }

  try {
    const invitation = await createUserInvitation({
      email,
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          emailAddress: invitation.emailAddress,
          status: invitation.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DashboardUserAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to create user", error);

    const clerkError = error as {
      status?: number;
      errors?: Array<{ longMessage?: string; message?: string }>;
      message?: string;
    };
    const message =
      clerkError.errors?.[0]?.longMessage ??
      clerkError.errors?.[0]?.message ??
      clerkError.message ??
      "Failed to create user";
    const status =
      typeof clerkError.status === "number" &&
      clerkError.status >= 400 &&
      clerkError.status < 600
        ? clerkError.status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
