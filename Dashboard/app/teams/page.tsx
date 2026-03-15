import { DashboardShell } from "@/components/dashboard-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function TeamsPage() {
  return (
    <DashboardShell title="Teams">
      <PlaceholderPage
        title="Teams"
        description="Review team records, ownership, and team-related administration from one place."
      />
    </DashboardShell>
  );
}
