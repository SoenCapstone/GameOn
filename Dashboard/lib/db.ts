import "server-only";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var gameOnDashboardDbPool: Pool | undefined;
}

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return databaseUrl;
}

function createPool(): Pool {
  return new Pool({
    connectionString: getDatabaseUrl(),
    ssl: process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : false,
  });
}

export function getDb(): Pool {
  if (!globalThis.gameOnDashboardDbPool) {
    globalThis.gameOnDashboardDbPool = createPool();
  }

  return globalThis.gameOnDashboardDbPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getDb().query<T>(text, params);
}
