import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

import data from "./dashboard/data.json";

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const isAdminAccount = await isAdmin({ userId });

  if (!isAdminAccount) {
    redirect("/login?reason=admin_required");
  }

  return (
    <DashboardShell title="Overview">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </DashboardShell>
  )
}
