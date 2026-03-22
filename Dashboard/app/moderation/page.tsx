import { DashboardShell } from "@/components/dashboard-shell";
import { ModerationQueue } from "@/components/moderation-queue";
import { getModerationQueueItems } from "@/lib/moderation";

export default async function ModerationPage() {
  const initialQueue = await getModerationQueueItems();

  return (
    <DashboardShell title="Moderation">
      <ModerationQueue initialQueue={initialQueue} />
    </DashboardShell>
  );
}
