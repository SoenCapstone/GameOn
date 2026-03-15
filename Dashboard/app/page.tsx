import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import {
  getTotalLeagues,
  getTotalMatches,
  getTotalMessages,
  getTotalPosts,
  getTotalRefereeProfiles,
  getTotalTeams,
  getTotalUsers,
  getTotalVenues,
} from "@/lib/metrics";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const isAdminAccount = await isAdmin({ userId });

  if (!isAdminAccount) {
    redirect("/login?reason=admin_required");
  }

  const [
    users,
    teams,
    matches,
    leagues,
    posts,
    messages,
    referees,
    venues,
  ] = await Promise.all([
    getTotalUsers(),
    getTotalTeams(),
    getTotalMatches(),
    getTotalLeagues(),
    getTotalPosts(),
    getTotalMessages(),
    getTotalRefereeProfiles(),
    getTotalVenues(),
  ]);

  return (
    <DashboardShell title="Overview">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards
          totals={{
            users,
            teams,
            matches,
            leagues,
            posts,
            messages,
            referees,
            venues,
          }}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
      </div>
    </DashboardShell>
  )
}
