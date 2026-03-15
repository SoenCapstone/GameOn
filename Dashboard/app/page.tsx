import { DashboardShell } from "@/components/dashboard-shell";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
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
import data from "./dashboard/data.json";

export default async function Page() {
  const [users, teams, matches, leagues, posts, messages, referees, venues] =
    await Promise.all([
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
  );
}
