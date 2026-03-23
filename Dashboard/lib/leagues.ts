import "server-only";

import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";

type DbLeagueRow = {
  id: string;
  name: string;
  sport: string;
  slug: string;
  logo_url: string | null;
  region: string | null;
  location: string | null;
  level: "RECREATIONAL" | "COMPETITIVE" | "YOUTH" | "AMATEUR" | "PROFESSIONAL" | null;
  privacy: "PUBLIC" | "PRIVATE";
  season_count: number | null;
  owner_user_id: string;
  created_at: string;
  owner_firstname: string | null;
  owner_lastname: string | null;
  owner_email: string | null;
  owner_image_url: string | null;
};

type CountRow = {
  total: number;
};

type ExistingUserRow = {
  id: string;
};

export type DashboardLeague = {
  id: string;
  name: string;
  sport: string;
  slug: string;
  logoUrl: string | null;
  region: string | null;
  location: string | null;
  level: "RECREATIONAL" | "COMPETITIVE" | "YOUTH" | "AMATEUR" | "PROFESSIONAL" | null;
  privacy: "PUBLIC" | "PRIVATE";
  seasonCount: number;
  ownerUserId: string;
  createdAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    imageUrl: string | null;
  };
};

export type DashboardLeaguesResponse = {
  leagues: DashboardLeague[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateDashboardLeagueInput = {
  ownerUserId: string;
  name: string;
  sport: string;
  region?: string;
  location?: string;
  level?: "RECREATIONAL" | "COMPETITIVE" | "YOUTH" | "AMATEUR" | "PROFESSIONAL";
  privacy?: "PUBLIC" | "PRIVATE";
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

function trimToNull(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
}

function slugFrom(input: string) {
  const slug = input
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/_/g, "-")
    .replace(/ +/g, "-")
    .toLowerCase();

  return slug || null;
}

async function generateUniqueLeagueSlug(name: string) {
  const baseSlug = slugFrom(name);

  if (!baseSlug) {
    throw new Error("Unable to generate league slug");
  }

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const result = await query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM leagues
          WHERE slug = $1
        ) AS exists
      `,
      [slug],
    );

    if (!result.rows[0]?.exists) {
      return slug;
    }

    slug = `${baseSlug}-${suffix++}`;
  }
}

export async function getLeagues(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<DashboardLeaguesResponse> {
  const limit = normalizeLimit(params?.limit ?? 25);
  const offset = normalizeOffset(params?.offset ?? 0);
  const searchPattern = buildSearchPattern(params?.search);

  const filters = searchPattern
    ? `
      AND (
        l.name ILIKE $1
        OR l.sport ILIKE $1
        OR COALESCE(l.slug, '') ILIKE $1
        OR COALESCE(l.region, '') ILIKE $1
        OR COALESCE(u.firstname, '') ILIKE $1
        OR COALESCE(u.lastname, '') ILIKE $1
        OR COALESCE(u.email, '') ILIKE $1
      )
    `
    : "";

  const listParams = searchPattern
    ? [searchPattern, limit, offset]
    : [limit, offset];
  const countParams = searchPattern ? [searchPattern] : [];

  const [leaguesResult, countResult] = await Promise.all([
    query<DbLeagueRow>(
      `
        SELECT
          l.id::text,
          l.name,
          l.sport,
          l.slug,
          l.logo_url,
          l.region,
          l.location,
          l.level,
          l.privacy,
          l.season_count,
          l.owner_user_id,
          l.created_at::text,
          u.firstname AS owner_firstname,
          u.lastname AS owner_lastname,
          u.email AS owner_email,
          u.image_url AS owner_image_url
        FROM leagues l
        LEFT JOIN users u ON u.id = l.owner_user_id
        WHERE l.archived_at IS NULL
        ${filters}
        ORDER BY l.created_at DESC
        LIMIT $${searchPattern ? 2 : 1}
        OFFSET $${searchPattern ? 3 : 2}
      `,
      listParams,
    ),
    query<CountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM leagues l
        LEFT JOIN users u ON u.id = l.owner_user_id
        WHERE l.archived_at IS NULL
        ${filters}
      `,
      countParams,
    ),
  ]);

  return {
    leagues: leaguesResult.rows.map((league) => ({
      id: league.id,
      name: league.name,
      sport: league.sport,
      slug: league.slug,
      logoUrl: league.logo_url,
      region: league.region,
      location: league.location,
      level: league.level,
      privacy: league.privacy,
      seasonCount: league.season_count ?? 0,
      ownerUserId: league.owner_user_id,
      createdAt: new Date(league.created_at).toISOString(),
      owner: {
        id: league.owner_user_id,
        firstName: league.owner_firstname,
        lastName: league.owner_lastname,
        email: league.owner_email,
        imageUrl: league.owner_image_url,
      },
    })),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getLeagueById(leagueId: string) {
  const result = await query<DbLeagueRow>(
    `
      SELECT
        l.id::text,
        l.name,
        l.sport,
        l.slug,
        l.region,
        l.location,
        l.level,
        l.privacy,
        l.season_count,
        l.owner_user_id,
        l.created_at::text,
        u.firstname AS owner_firstname,
        u.lastname AS owner_lastname,
        u.email AS owner_email,
        u.image_url AS owner_image_url
      FROM leagues l
      LEFT JOIN users u ON u.id = l.owner_user_id
      WHERE l.id = $1
      LIMIT 1
    `,
    [leagueId],
  );

  const league = result.rows[0];

  if (!league) {
    throw new Error("Failed to load created league.");
  }

  return {
    id: league.id,
    name: league.name,
    sport: league.sport,
    slug: league.slug,
    logoUrl: league.logo_url,
    region: league.region,
    location: league.location,
    level: league.level,
    privacy: league.privacy,
    seasonCount: league.season_count ?? 0,
    ownerUserId: league.owner_user_id,
    createdAt: new Date(league.created_at).toISOString(),
    owner: {
      id: league.owner_user_id,
      firstName: league.owner_firstname,
      lastName: league.owner_lastname,
      email: league.owner_email,
      imageUrl: league.owner_image_url,
    },
  } satisfies DashboardLeague;
}

export async function createLeague(input: CreateDashboardLeagueInput) {
  const ownerUserId = input.ownerUserId.trim();
  const name = input.name.trim();
  const sport = trimToNull(input.sport);
  const region = trimToNull(input.region) ?? "Canada";
  const location = trimToNull(input.location);
  const level = input.level ?? "COMPETITIVE";
  const privacy = input.privacy ?? "PRIVATE";

  if (!ownerUserId) {
    throw new Error("League owner is required.");
  }

  if (!name) {
    throw new Error("League name is required.");
  }

  if (!sport) {
    throw new Error("Sport is required.");
  }

  const ownerResult = await query<ExistingUserRow>(
    `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [ownerUserId],
  );

  if (!ownerResult.rows[0]) {
    throw new Error("Selected owner does not exist.");
  }

  const slug = await generateUniqueLeagueSlug(name);
  const leagueId = randomUUID();

  await query(
    `
      INSERT INTO leagues (
        id,
        name,
        sport,
        slug,
        location,
        region,
        owner_user_id,
        level,
        privacy,
        season_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
    `,
    [
      leagueId,
      name,
      sport,
      slug,
      location,
      region,
      ownerUserId,
      level,
      privacy,
    ],
  );

  return getLeagueById(leagueId);
}

export async function archiveLeague(leagueId: string) {
  const result = await query<{ id: string }>(
    `
      UPDATE leagues
      SET archived_at = NOW()
      WHERE id = $1
        AND archived_at IS NULL
      RETURNING id::text
    `,
    [leagueId],
  );

  if (!result.rows[0]) {
    throw new Error("League not found.");
  }

  return result.rows[0];
}
