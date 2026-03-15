import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { PlaceholderPage } from "@/components/placeholder-page";
import { isAdmin } from "@/lib/auth";

export default async function TeamsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const isAdminAccount = await isAdmin({ userId });

  if (!isAdminAccount) {
    redirect("/login?reason=admin_required");
  }

  return (
    <DashboardShell title="Teams">
      <PlaceholderPage
        title="Teams"
        description="Review team records, ownership, and team-related administration from one place."
      />
    </DashboardShell>
  );
}
