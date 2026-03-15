import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { PlaceholderPage } from "@/components/placeholder-page"
import { isAdmin } from "@/lib/auth"

export default async function LeaguesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const isAdminAccount = await isAdmin({ userId })

  if (!isAdminAccount) {
    redirect("/login?reason=admin_required")
  }

  return (
    <DashboardShell title="Leagues">
      <PlaceholderPage
        title="Leagues"
        description="Inspect league setup, ownership, and league-level administration in this section."
      />
    </DashboardShell>
  )
}
