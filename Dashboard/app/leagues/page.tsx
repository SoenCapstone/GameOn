import { DashboardShell } from "@/components/dashboard-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function LeaguesPage() {
  return (
    <DashboardShell title="Leagues">
      <PlaceholderPage
        title="Leagues"
        description="Inspect league setup, ownership, and league-level administration in this section."
      />
    </DashboardShell>
  );
}
