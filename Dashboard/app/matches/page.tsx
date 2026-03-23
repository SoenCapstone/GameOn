import { DashboardShell } from "@/components/dashboard-shell";
import { MatchesGrid } from "@/components/matches-grid";
import { getMatches } from "@/lib/matches";

export default async function MatchesPage() {
  const initialMatches = await getMatches();

  return (
    <DashboardShell title="Matches">
      <MatchesGrid initialMatches={initialMatches} />
    </DashboardShell>
  );
}
