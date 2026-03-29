import "server-only";
import { query } from "@/lib/db";

export const activityEntities = [
  "teams",
  "leagues",
  "matches",
  "posts",
  "messages",
] as const;

export const activityPeriods = ["7d", "30d", "1y"] as const;

export type ActivityEntity = (typeof activityEntities)[number];
export type ActivityPeriod = (typeof activityPeriods)[number];

export type ActivityPoint = {
  date: string;
  total: number;
};

type ActivityRow = {
  bucket_key: string;
  total: number;
};

type PeriodConfig = {
  bucket: "day" | "month";
  bucketFormat: "YYYY-MM-DD" | "YYYY-MM-01";
  start: Date;
  endExclusive: Date;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function getPeriodConfig(period: ActivityPeriod): PeriodConfig {
  const now = new Date();

  switch (period) {
    case "7d": {
      const start = startOfDay(addDays(now, -6));
      const endExclusive = addDays(startOfDay(now), 1);
      return {
        bucket: "day",
        bucketFormat: "YYYY-MM-DD",
        start,
        endExclusive,
      };
    }
    case "30d": {
      const start = startOfDay(addDays(now, -29));
      const endExclusive = addDays(startOfDay(now), 1);
      return {
        bucket: "day",
        bucketFormat: "YYYY-MM-DD",
        start,
        endExclusive,
      };
    }
    case "1y": {
      const start = startOfMonth(addMonths(now, -11));
      const endExclusive = addMonths(startOfMonth(now), 1);
      return {
        bucket: "month",
        bucketFormat: "YYYY-MM-01",
        start,
        endExclusive,
      };
    }
  }
}

function getSourceSql(entity: ActivityEntity): string {
  switch (entity) {
    case "teams":
      return `
        SELECT created_at
        FROM teams
        WHERE deleted_at IS NULL
      `;
    case "leagues":
      return `
        SELECT created_at
        FROM leagues
        WHERE archived_at IS NULL
      `;
    case "matches":
      return `
        SELECT created_at
        FROM team_matches
        UNION ALL
        SELECT created_at
        FROM league_matches
      `;
    case "posts":
      return `
        SELECT created_at
        FROM team_posts
        UNION ALL
        SELECT created_at
        FROM league_posts
      `;
    case "messages":
      return `
        SELECT created_at
        FROM messages
        WHERE deleted_at IS NULL
      `;
  }
}

function buildExpectedKeys(
  period: ActivityPeriod,
  config: PeriodConfig,
): string[] {
  const keys: string[] = [];

  if (config.bucket === "day") {
    let cursor = new Date(config.start);

    while (cursor < config.endExclusive) {
      keys.push(formatDayKey(cursor));
      cursor = addDays(cursor, 1);
    }

    return keys;
  }

  let cursor = new Date(config.start);

  while (cursor < config.endExclusive) {
    keys.push(formatMonthKey(cursor));
    cursor = addMonths(cursor, 1);
  }

  return keys;
}

export function isActivityEntity(value: string): value is ActivityEntity {
  return activityEntities.includes(value as ActivityEntity);
}

export function isActivityPeriod(value: string): value is ActivityPeriod {
  return activityPeriods.includes(value as ActivityPeriod);
}

export async function getActivitySeries(
  entity: ActivityEntity,
  period: ActivityPeriod,
): Promise<ActivityPoint[]> {
  const config = getPeriodConfig(period);
  const sourceSql = getSourceSql(entity);

  const result = await query<ActivityRow>(
    `
      SELECT
        to_char(
          date_trunc('${config.bucket}', created_at),
          '${config.bucketFormat}'
        ) AS bucket_key,
        COUNT(*)::int AS total
      FROM (
        ${sourceSql}
      ) AS events
      WHERE created_at >= $1
        AND created_at < $2
      GROUP BY bucket_key
      ORDER BY bucket_key
    `,
    [config.start.toISOString(), config.endExclusive.toISOString()],
  );

  const countsByKey = new Map(
    result.rows.map((row) => [row.bucket_key, row.total]),
  );

  return buildExpectedKeys(period, config).map((date) => ({
    date,
    total: countsByKey.get(date) ?? 0,
  }));
}
