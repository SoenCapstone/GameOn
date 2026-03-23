import { DashboardShell } from "@/components/dashboard-shell";
import { LeaguesTable } from "@/components/leagues-table";
import { getLeagues } from "@/lib/leagues";

export default async function LeaguesPage() {
  const initialData = await getLeagues({ limit: 9, offset: 0 });

  return (
    <DashboardShell title="Leagues">
      <LeaguesTable initialData={initialData} />
    </DashboardShell>
  );
}
