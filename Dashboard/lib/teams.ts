import "server-only";

import { randomUUID } from "node:crypto";
import { getDb, query } from "@/lib/db";

type DbTeamRow = {
  id: string;
  name: string;
  sport: string | null;
  scope: string | null;
  slug: string;
  logo_url: string | null;
  location: string | null;
  max_roster: number | null;
  privacy: "PUBLIC" | "PRIVATE";
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

export type DashboardTeam = {
  id: string;
  name: string;
  sport: string | null;
  scope: string | null;
  slug: string;
  logoUrl: string | null;
  location: string | null;
  maxRoster: number | null;
  privacy: "PUBLIC" | "PRIVATE";
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

export type DashboardTeamsResponse = {
  teams: DashboardTeam[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateDashboardTeamInput = {
  ownerUserId: string;
  name: string;
  sport: string;
  scope?: string;
  location: string;
  allowedRegions: string[];
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

function normalizeAllowedRegions(regions: string[]) {
  return Array.from(
    new Set(
      regions
        .map((region) => region.trim())
        .filter((region) => region.length > 0),
    ),
  );
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

async function generateUniqueTeamSlug(name: string) {
  const baseSlug = slugFrom(name);

  if (!baseSlug) {
    throw new Error("Unable to generate team slug");
  }

  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const result = await query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM teams
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

export async function getTeams(params?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<DashboardTeamsResponse> {
  const limit = normalizeLimit(params?.limit ?? 25);
  const offset = normalizeOffset(params?.offset ?? 0);
  const searchPattern = buildSearchPattern(params?.search);

  const filters = searchPattern
    ? `
      AND (
        t.name ILIKE $1
        OR COALESCE(t.sport, '') ILIKE $1
        OR COALESCE(t.slug, '') ILIKE $1
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

  const [teamsResult, countResult] = await Promise.all([
    query<DbTeamRow>(
      `
        SELECT
          t.id::text,
          t.name,
          t.sport,
          t.scope,
          t.slug,
          t.logo_url,
          t.location,
          t.max_roster,
          t.privacy,
          t.owner_user_id,
          t.created_at::text,
          u.firstname AS owner_firstname,
          u.lastname AS owner_lastname,
          u.email AS owner_email,
          u.image_url AS owner_image_url
        FROM teams t
        LEFT JOIN users u ON u.id = t.owner_user_id
        WHERE t.deleted_at IS NULL
        ${filters}
        ORDER BY t.created_at DESC
        LIMIT $${searchPattern ? 2 : 1}
        OFFSET $${searchPattern ? 3 : 2}
      `,
      listParams,
    ),
    query<CountRow>(
      `
        SELECT COUNT(*)::int AS total
        FROM teams t
        LEFT JOIN users u ON u.id = t.owner_user_id
        WHERE t.deleted_at IS NULL
        ${filters}
      `,
      countParams,
    ),
  ]);

  return {
    teams: teamsResult.rows.map((team) => ({
      id: team.id,
      name: team.name,
      sport: team.sport,
      scope: team.scope,
      slug: team.slug,
      logoUrl: team.logo_url,
      location: team.location,
      maxRoster: team.max_roster,
      privacy: team.privacy,
      ownerUserId: team.owner_user_id,
      createdAt: new Date(team.created_at).toISOString(),
      owner: {
        id: team.owner_user_id,
        firstName: team.owner_firstname,
        lastName: team.owner_lastname,
        email: team.owner_email,
        imageUrl: team.owner_image_url,
      },
    })),
    total: countResult.rows[0]?.total ?? 0,
    limit,
    offset,
  };
}

async function getTeamById(teamId: string) {
  const result = await query<DbTeamRow>(
    `
      SELECT
        t.id::text,
        t.name,
        t.sport,
        t.scope,
        t.slug,
        t.location,
        t.max_roster,
        t.privacy,
        t.owner_user_id,
        t.created_at::text,
        u.firstname AS owner_firstname,
        u.lastname AS owner_lastname,
        u.email AS owner_email,
        u.image_url AS owner_image_url
      FROM teams t
      LEFT JOIN users u ON u.id = t.owner_user_id
      WHERE t.id = $1
      LIMIT 1
    `,
    [teamId],
  );

  const team = result.rows[0];

  if (!team) {
    throw new Error("Failed to load created team.");
  }

  return {
    id: team.id,
    name: team.name,
    sport: team.sport,
    scope: team.scope,
    slug: team.slug,
    logoUrl: team.logo_url,
    location: team.location,
    maxRoster: team.max_roster,
    privacy: team.privacy,
    ownerUserId: team.owner_user_id,
    createdAt: new Date(team.created_at).toISOString(),
    owner: {
      id: team.owner_user_id,
      firstName: team.owner_firstname,
      lastName: team.owner_lastname,
      email: team.owner_email,
      imageUrl: team.owner_image_url,
    },
  } satisfies DashboardTeam;
}

export async function createTeam(input: CreateDashboardTeamInput) {
  const ownerUserId = input.ownerUserId.trim();
  const name = input.name.trim();
  const sport = trimToNull(input.sport);
  const scope = trimToNull(input.scope);
  const location = trimToNull(input.location);
  const allowedRegions = normalizeAllowedRegions(input.allowedRegions);
  const privacy = input.privacy ?? "PRIVATE";

  if (!ownerUserId) {
    throw new Error("Team owner is required.");
  }

  if (!name) {
    throw new Error("Team name is required.");
  }

  if (!sport) {
    throw new Error("Sport is required.");
  }

  if (!location) {
    throw new Error("Location is required.");
  }

  if (allowedRegions.length === 0) {
    throw new Error("At least one allowed region is required.");
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

  const slug = await generateUniqueTeamSlug(name);
  const teamId = randomUUID();
  const teamMemberId = randomUUID();
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
        INSERT INTO teams (
          id,
          name,
          sport,
          scope,
          owner_user_id,
          slug,
          location,
          privacy
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [teamId, name, sport, scope, ownerUserId, slug, location, privacy],
    );

    for (const region of allowedRegions) {
      await client.query(
        `
          INSERT INTO team_allowed_regions (team_id, region)
          VALUES ($1, $2)
        `,
        [teamId, region],
      );
    }

    await client.query(
      `
        INSERT INTO team_members (id, team_id, user_id, role, status)
        VALUES ($1, $2, $3, 'OWNER', 'ACTIVE')
      `,
      [teamMemberId, teamId, ownerUserId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getTeamById(teamId);
}

export async function archiveTeam(teamId: string) {
  const result = await query<{ id: string }>(
    `
      UPDATE teams
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id::text
    `,
    [teamId],
  );

  if (!result.rows[0]) {
    throw new Error("Team not found.");
  }

  return result.rows[0];
}
