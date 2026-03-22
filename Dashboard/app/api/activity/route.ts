import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  activityEntities,
  activityPeriods,
  getActivitySeries,
  isActivityEntity,
  isActivityPeriod,
} from "@/lib/activity";

export async function GET(request: Request) {
  const adminCheck = await requireAdminApi();

  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const period = searchParams.get("period");

  if (!entity || !isActivityEntity(entity)) {
    return NextResponse.json(
      {
        error: "Invalid entity",
        allowed: activityEntities,
      },
      { status: 400 },
    );
  }

  if (!period || !isActivityPeriod(period)) {
    return NextResponse.json(
      {
        error: "Invalid period",
        allowed: activityPeriods,
      },
      { status: 400 },
    );
  }

  try {
    const points = await getActivitySeries(entity, period);

    return NextResponse.json({
      entity,
      period,
      points,
    });
  } catch (error) {
    console.error("Failed to load activity series", error);

    return NextResponse.json(
      { error: "Failed to load activity series" },
      { status: 500 },
    );
  }
}
