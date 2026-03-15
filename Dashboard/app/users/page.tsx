import { DashboardShell } from "@/components/dashboard-shell";
import { UsersTable } from "@/components/users-table";
import { getUsers } from "@/lib/users";

export default async function UsersPage() {
  const initialData = await getUsers({ limit: 10, offset: 0 });

  return (
    <DashboardShell title="Users">
      <UsersTable initialData={initialData} />
    </DashboardShell>
  );
}
