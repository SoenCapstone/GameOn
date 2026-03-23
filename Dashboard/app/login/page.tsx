import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LoginForm } from "@/components/login-form";
import { isAdmin } from "@/lib/auth";

export default async function LoginPage() {
  const { userId, sessionClaims } = await auth();
  const hasSignedInNonAdminUser = Boolean(userId);

  if (userId && (await isAdmin({ userId, sessionClaims }))) {
    redirect("/");
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm shouldClearSession={hasSignedInNonAdminUser} />
      </div>
    </div>
  );
}
