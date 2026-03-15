import "server-only";
import { query } from "@/lib/db";

type DbUserRow = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  image_url: string | null;
};

type CountRow = {
  total: number;
};

export type DashboardUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  imageUrl: string | null;
};

export type DashboardUsersResponse = {
  users: DashboardUser[];
  total: number;
  limit: number;
  offset: number;
};

function normalizeLimit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 25;
  }

  return Math.min(value, 100);
}

function normalizeOffset(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function buildSearchPattern(search?: string): string | null {
  const trimmed = search?.trim();

  if (!trimmed) {
    return null;
  }

  return `%${trimmed}%`;
}

export async function getUsers(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<DashboardUsersResponse> {
  const limit = normalizeLimit(params?.limit ?? 25);
  const offset = normalizeOffset(params?.offset ?? 0);
  const searchPattern = buildSearchPattern(params?.search);

  const filters = searchPattern
    ? `
      WHERE
        COALESCE(firstname, '') ILIKE $1
        OR COALESCE(lastname, '') ILIKE $1
        OR COALESCE(email, '') ILIKE $1
    `
    : "";

  const listParams = searchPattern
    ? [searchPattern, limit, offset]
    : [limit, offset];

  const countParams = searchPattern ? [searchPattern] : [];

  const [usersResult, countResult] = await Promise.all([
    query<DbUserRow>(
      `
        SELECT id, firstname, lastname, email, image_url
        FROM users
        ${filters}
        ORDER BY COALESCE(firstname, ''), COALESCE(lastname, ''), id
        LIMIT $${searchPattern ? 2 : 1}
        OFFSET $${searchPattern ? 3 : 2}
      `,
      listParams,
    ),
    query<CountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM users
        ${filters}
      `,
      countParams,
    ),
  ]);

  return {
    users: usersResult.rows.map((user) => ({
      id: user.id,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      imageUrl: user.image_url,
    })),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}
