import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { DashboardShell } from "@/components/dashboard-shell"
import { PlaceholderPage } from "@/components/placeholder-page"
import { isAdmin } from "@/lib/auth"

export default async function ModerationPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const isAdminAccount = await isAdmin({ userId })

  if (!isAdminAccount) {
    redirect("/login?reason=admin_required")
  }

  return (
    <DashboardShell title="Moderation">
      <PlaceholderPage
        title="Moderation"
        description="Use this section for reviewing reports, flagged content, and future moderation workflows."
      />
    </DashboardShell>
  )
}
