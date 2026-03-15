import { DashboardShell } from "@/components/dashboard-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function MatchesPage() {
  return (
    <DashboardShell title="Matches">
      <PlaceholderPage
        title="Matches"
        description="Track scheduled matches and reserve this area for future match administration tools."
      />
    </DashboardShell>
  );
}
