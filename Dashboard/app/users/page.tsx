import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { PlaceholderPage } from "@/components/placeholder-page";
import { isAdmin } from "@/lib/auth";

export default async function UsersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const isAdminAccount = await isAdmin({ userId });

  if (!isAdminAccount) {
    redirect("/login?reason=admin_required");
  }

  return (
    <DashboardShell title="Users">
      <PlaceholderPage
        title="Users"
        description="Browse, inspect, and manage platform user accounts from the admin dashboard."
      />
    </DashboardShell>
  );
}
