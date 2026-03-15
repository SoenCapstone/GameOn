import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LoginForm } from "@/components/login-form"
import { isAdmin } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const { userId } = await auth();

  if (userId && (await isAdmin({ userId }))) {
    redirect("/");
  }

  const message =
    params.reason === "admin_required"
      ? "This dashboard is restricted to admin accounts."
      : undefined;

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm message={message} />
      </div>
    </div>
  )
}
