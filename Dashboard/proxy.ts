import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

const isPublicRoute = createRouteMatcher(["/login(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isAdminAccount = await isAdmin({ userId });

  if (!isAdminAccount) {
    return NextResponse.redirect(
      new URL("/login?reason=admin_required", req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
