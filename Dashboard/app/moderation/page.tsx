import { DashboardShell } from "@/components/dashboard-shell";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function ModerationPage() {
  return (
    <DashboardShell title="Moderation">
      <PlaceholderPage
        title="Moderation"
        description="Use this section for reviewing reports, flagged content, and future moderation workflows."
      />
    </DashboardShell>
  );
}
