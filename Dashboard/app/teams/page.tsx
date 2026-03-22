import { DashboardShell } from "@/components/dashboard-shell";
import { TeamsTable } from "@/components/teams-table";
import { getTeams } from "@/lib/teams";

export default async function TeamsPage() {
  const initialData = await getTeams({ limit: 9, offset: 0 });

  return (
    <DashboardShell title="Teams">
      <TeamsTable initialData={initialData} />
    </DashboardShell>
  );
}
