import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";

export async function GET() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const isAdminAccount = await isAdmin({ userId, sessionClaims });

  return NextResponse.json({ isAdmin: isAdminAccount });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
  } | null;
  const email = body?.email?.trim();

  if (!email) {
    return NextResponse.json({ isAdmin: false }, { status: 400 });
  }

  const isAdminAccount = await isAdmin({ email });

  return NextResponse.json({ isAdmin: isAdminAccount });
}
