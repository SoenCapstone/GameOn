import "server-only";

import { query } from "@/lib/db";

type TeamMatchRow = {
  id: string;
  status: "PENDING_TEAM_ACCEPTANCE" | "CONFIRMED" | "DECLINED" | "CANCELLED";
  home_team_id: string;
  away_team_id: string;
  sport: string | null;
  start_time: string;
  end_time: string;
  match_location: string | null;
  venue_id: string | null;
  requires_referee: boolean;
  referee_user_id: string | null;
  created_by_user_id: string;
  cancelled_by_user_id: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  home_team_name: string;
  home_team_logo_url: string | null;
  away_team_name: string;
  away_team_logo_url: string | null;
  venue_name: string | null;
  referee_firstname: string | null;
  referee_lastname: string | null;
  referee_email: string | null;
};

type LeagueMatchRow = {
  id: string;
  league_id: string;
  status: "CONFIRMED" | "CANCELLED";
  home_team_id: string;
  away_team_id: string;
  sport: string | null;
  start_time: string;
  end_time: string;
  match_location: string | null;
  venue_id: string | null;
  requires_referee: boolean;
  referee_user_id: string | null;
  created_by_user_id: string;
  cancelled_by_user_id: string | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  league_name: string;
  home_team_name: string;
  home_team_logo_url: string | null;
  away_team_name: string;
  away_team_logo_url: string | null;
  venue_name: string | null;
  referee_firstname: string | null;
  referee_lastname: string | null;
  referee_email: string | null;
};

export type DashboardMatch = {
  id: string;
  matchType: "TEAM_MATCH" | "LEAGUE_MATCH";
  leagueId: string | null;
  leagueName: string | null;
  label: string;
  status: "PENDING_TEAM_ACCEPTANCE" | "CONFIRMED" | "DECLINED" | "CANCELLED";
  sport: string | null;
  startTime: string;
  endTime: string;
  venue: string | null;
  requiresReferee: boolean;
  referee: {
    userId: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  createdByUserId: string;
  cancelledByUserId: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
};

function toReferee(params: {
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}) {
  if (!params.userId && !params.email && !params.firstName && !params.lastName) {
    return null;
  }

  return {
    userId: params.userId,
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
  };
}

export async function getMatches() {
  const [teamMatchesResult, leagueMatchesResult] = await Promise.all([
    query<TeamMatchRow>(
      `
        SELECT
          tm.id::text,
          tm.status,
          tm.home_team_id::text,
          tm.away_team_id::text,
          tm.sport,
          tm.start_time::text,
          tm.end_time::text,
          tm.match_location,
          tm.venue_id::text,
          tm.requires_referee,
          tm.referee_user_id,
          tm.created_by_user_id,
          tm.cancelled_by_user_id,
          tm.cancel_reason,
          tm.cancelled_at::text,
          tm.created_at::text,
          ht.name AS home_team_name,
          ht.logo_url AS home_team_logo_url,
          at.name AS away_team_name,
          at.logo_url AS away_team_logo_url,
          v.name AS venue_name,
          ru.firstname AS referee_firstname,
          ru.lastname AS referee_lastname,
          ru.email AS referee_email
        FROM team_matches tm
        INNER JOIN teams ht ON ht.id = tm.home_team_id
        INNER JOIN teams at ON at.id = tm.away_team_id
        LEFT JOIN venues v ON v.id = tm.venue_id
        LEFT JOIN users ru ON ru.id = tm.referee_user_id
        ORDER BY tm.start_time DESC
      `,
    ),
    query<LeagueMatchRow>(
      `
        SELECT
          lm.id::text,
          lm.league_id::text,
          lm.status,
          lm.home_team_id::text,
          lm.away_team_id::text,
          lm.sport,
          lm.start_time::text,
          lm.end_time::text,
          lm.match_location,
          lm.venue_id::text,
          lm.requires_referee,
          lm.referee_user_id,
          lm.created_by_user_id,
          lm.cancelled_by_user_id,
          lm.cancel_reason,
          lm.cancelled_at::text,
          lm.created_at::text,
          l.name AS league_name,
          ht.name AS home_team_name,
          ht.logo_url AS home_team_logo_url,
          at.name AS away_team_name,
          at.logo_url AS away_team_logo_url,
          v.name AS venue_name,
          ru.firstname AS referee_firstname,
          ru.lastname AS referee_lastname,
          ru.email AS referee_email
        FROM league_matches lm
        INNER JOIN leagues l ON l.id = lm.league_id
        INNER JOIN teams ht ON ht.id = lm.home_team_id
        INNER JOIN teams at ON at.id = lm.away_team_id
        LEFT JOIN venues v ON v.id = lm.venue_id
        LEFT JOIN users ru ON ru.id = lm.referee_user_id
        ORDER BY lm.start_time DESC
      `,
    ),
  ]);

  const teamMatches: DashboardMatch[] = teamMatchesResult.rows.map((match) => ({
    id: match.id,
    matchType: "TEAM_MATCH",
    leagueId: null,
    leagueName: null,
    label: "Team Match",
    status: match.status,
    sport: match.sport,
    startTime: new Date(match.start_time).toISOString(),
    endTime: new Date(match.end_time).toISOString(),
    venue: match.venue_name ?? match.match_location,
    requiresReferee: match.requires_referee,
    referee: toReferee({
      userId: match.referee_user_id,
      firstName: match.referee_firstname,
      lastName: match.referee_lastname,
      email: match.referee_email,
    }),
    homeTeam: {
      id: match.home_team_id,
      name: match.home_team_name,
      logoUrl: match.home_team_logo_url,
    },
    awayTeam: {
      id: match.away_team_id,
      name: match.away_team_name,
      logoUrl: match.away_team_logo_url,
    },
    createdByUserId: match.created_by_user_id,
    cancelledByUserId: match.cancelled_by_user_id,
    cancelReason: match.cancel_reason,
    cancelledAt: match.cancelled_at ? new Date(match.cancelled_at).toISOString() : null,
  }));

  const leagueMatches: DashboardMatch[] = leagueMatchesResult.rows.map((match) => ({
    id: match.id,
    matchType: "LEAGUE_MATCH",
    leagueId: match.league_id,
    leagueName: match.league_name,
    label: match.league_name,
    status: match.status,
    sport: match.sport,
    startTime: new Date(match.start_time).toISOString(),
    endTime: new Date(match.end_time).toISOString(),
    venue: match.venue_name ?? match.match_location,
    requiresReferee: match.requires_referee,
    referee: toReferee({
      userId: match.referee_user_id,
      firstName: match.referee_firstname,
      lastName: match.referee_lastname,
      email: match.referee_email,
    }),
    homeTeam: {
      id: match.home_team_id,
      name: match.home_team_name,
      logoUrl: match.home_team_logo_url,
    },
    awayTeam: {
      id: match.away_team_id,
      name: match.away_team_name,
      logoUrl: match.away_team_logo_url,
    },
    createdByUserId: match.created_by_user_id,
    cancelledByUserId: match.cancelled_by_user_id,
    cancelReason: match.cancel_reason,
    cancelledAt: match.cancelled_at ? new Date(match.cancelled_at).toISOString() : null,
  }));

  return [...leagueMatches, ...teamMatches].sort((left, right) =>
    right.startTime.localeCompare(left.startTime),
  );
}

export async function cancelMatch(params: {
  matchId: string;
  matchType: "TEAM_MATCH" | "LEAGUE_MATCH";
  cancelledByUserId: string;
}) {
  const reason = "Cancelled by GameOn Admin";

  if (params.matchType === "TEAM_MATCH") {
    const result = await query<{ id: string }>(
      `
        UPDATE team_matches
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by_user_id = $2,
          cancel_reason = $3
        WHERE id = $1
        RETURNING id::text
      `,
      [params.matchId, params.cancelledByUserId, reason],
    );

    if (!result.rows[0]) {
      throw new Error("Match not found.");
    }

    return result.rows[0];
  }

  const result = await query<{ id: string }>(
    `
      UPDATE league_matches
      SET
        status = 'CANCELLED',
        cancelled_at = NOW(),
        cancelled_by_user_id = $2,
        cancel_reason = $3
      WHERE id = $1
      RETURNING id::text
    `,
    [params.matchId, params.cancelledByUserId, reason],
  );

  if (!result.rows[0]) {
    throw new Error("Match not found.");
  }

  return result.rows[0];
}
