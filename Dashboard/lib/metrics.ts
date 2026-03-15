import "server-only";

import { query } from "@/lib/db";

type CountRow = {
  total: number;
};

async function getCount(sql: string): Promise<number> {
  const result = await query<CountRow>(sql);
  return result.rows[0]?.total ?? 0;
}

export async function getTotalUsers(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM users");
}

export async function getTotalTeams(): Promise<number> {
  return getCount(
    "SELECT COUNT(*)::int AS total FROM teams WHERE deleted_at IS NULL",
  );
}

export async function getTotalLeagues(): Promise<number> {
  return getCount(
    "SELECT COUNT(*)::int AS total FROM leagues WHERE archived_at IS NULL",
  );
}

export async function getTotalTeamMatches(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM team_matches");
}

export async function getTotalLeagueMatches(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM league_matches");
}

export async function getTotalMatches(): Promise<number> {
  const [teamMatches, leagueMatches] = await Promise.all([
    getTotalTeamMatches(),
    getTotalLeagueMatches(),
  ]);

  return teamMatches + leagueMatches;
}

export async function getTotalTeamPosts(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM team_posts");
}

export async function getTotalLeaguePosts(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM league_posts");
}

export async function getTotalPosts(): Promise<number> {
  const [teamPosts, leaguePosts] = await Promise.all([
    getTotalTeamPosts(),
    getTotalLeaguePosts(),
  ]);

  return teamPosts + leaguePosts;
}

export async function getTotalMessages(): Promise<number> {
  return getCount(
    "SELECT COUNT(*)::int AS total FROM messages WHERE deleted_at IS NULL",
  );
}

export async function getTotalRefereeProfiles(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM referee_profiles");
}

export async function getTotalVenues(): Promise<number> {
  return getCount("SELECT COUNT(*)::int AS total FROM venues");
}
