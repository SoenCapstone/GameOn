import {
  MATCH_ATTENDANCE_ACTIONS,
  MATCH_DETAILS_DEFAULTS,
} from "@/constants/match-details";
import type {
  MatchAttendanceAction,
  MatchDetailsDisplayMatch,
  MatchMemberAttendanceStatus,
  MatchSpace,
  MatchTeamSummaryMap,
} from "@/types/match-details";
import { isCancelledMatchStatus, isPastMatch } from "@/utils/matches";

export function isLeagueMatch(
  match: MatchDetailsDisplayMatch | null | undefined,
): match is MatchDetailsDisplayMatch & { leagueId: string } {
  return Boolean(match && "leagueId" in match);
}

export function getMatchLeagueId(
  match: MatchDetailsDisplayMatch | null | undefined,
): string {
  return isLeagueMatch(match) ? match.leagueId : "";
}

export function getMatchTeamIds(
  match: MatchDetailsDisplayMatch | null | undefined,
): string[] {
  if (!match) {
    return [];
  }

  return [match.homeTeamId, match.awayTeamId].filter(Boolean);
}

function isMatchTeamOwner(args: {
  match: MatchDetailsDisplayMatch | null | undefined;
  userId: string | null | undefined;
  teamSummaryMap?: MatchTeamSummaryMap;
}): boolean {
  const { match, userId, teamSummaryMap } = args;

  if (!match || !userId) {
    return false;
  }

  const homeOwnerId = teamSummaryMap?.[match.homeTeamId]?.ownerUserId;
  const awayOwnerId = teamSummaryMap?.[match.awayTeamId]?.ownerUserId;

  return homeOwnerId === userId || awayOwnerId === userId;
}

export function canUserCancelMatch(args: {
  match: MatchDetailsDisplayMatch | null | undefined;
  userId: string | null | undefined;
  isLeagueOwner: boolean;
  teamSummaryMap?: MatchTeamSummaryMap;
}): boolean {
  const { match, userId, isLeagueOwner, teamSummaryMap } = args;

  if (!match) {
    return false;
  }

  if (isPastMatch(match.startTime) || isCancelledMatchStatus(match.status)) {
    return false;
  }

  if (isLeagueMatch(match)) {
    return isLeagueOwner;
  }

  return isMatchTeamOwner({ match, userId, teamSummaryMap });
}

export function canUserSubmitMatchScore(args: {
  match: MatchDetailsDisplayMatch | null | undefined;
  userId: string | null | undefined;
  teamSummaryMap?: MatchTeamSummaryMap;
}): boolean {
  const { match, userId, teamSummaryMap } = args;

  if (!match || !userId || isLeagueMatch(match) || match.status !== "CONFIRMED") {
    return false;
  }

  if (match.requiresReferee) {
    return match.refereeUserId === userId;
  }

  return isMatchTeamOwner({ match, userId, teamSummaryMap });
}

export function getMatchAttendanceAction(args: {
  match: MatchDetailsDisplayMatch | null | undefined;
  space?: MatchSpace;
  spaceId?: string;
  role?: string | null;
  isActiveMember?: boolean;
  hasResponded?: boolean;
  attendanceStatus?: MatchMemberAttendanceStatus | null;
}): MatchAttendanceAction | null {
  const {
    match,
    space,
    spaceId,
    role,
    isActiveMember,
    hasResponded,
    attendanceStatus,
  } = args;

  if (!match || space !== "team" || !spaceId || !isActiveMember || hasResponded) {
    return null;
  }

  if (isPastMatch(match.startTime) || isCancelledMatchStatus(match.status)) {
    return null;
  }

  if (role === "PLAYER") {
    return MATCH_ATTENDANCE_ACTIONS.PLAYER;
  }

  if (role === "REPLACEMENT" && attendanceStatus === "PENDING") {
    return MATCH_ATTENDANCE_ACTIONS.REPLACEMENT;
  }

  return null;
}

export function getContextLabel(args: {
  space?: MatchSpace;
  leagueName?: string;
  matchLeagueName?: string;
}): string {
  const { space, leagueName, matchLeagueName } = args;

  if (space === "league") {
    return leagueName ?? MATCH_DETAILS_DEFAULTS.leagueLabel;
  }

  if (matchLeagueName) {
    return matchLeagueName;
  }

  return MATCH_DETAILS_DEFAULTS.teamLabel;
}

export function getIsMatchLoading(args: {
  space?: MatchSpace;
  leagueMatchesLoading: boolean;
  directMatchLoading: boolean;
  teamMatchesLoading: boolean;
}): boolean {
  const {
    space,
    leagueMatchesLoading,
    directMatchLoading,
    teamMatchesLoading,
  } = args;

  if (space === "league") {
    return leagueMatchesLoading;
  }

  if (space === "team") {
    return directMatchLoading || teamMatchesLoading;
  }

  return directMatchLoading;
}

function normalizeScore(value: unknown): number | null | undefined {
  if (typeof value === "number" || value === null) {
    return value;
  }

  return undefined;
}

export function getMatchScores(
  match: MatchDetailsDisplayMatch | null | undefined,
): {
  homeScore?: number | null;
  awayScore?: number | null;
} {
  if (!match) {
    return {};
  }

  return {
    awayScore: normalizeScore(match.awayScore),
    homeScore: normalizeScore(match.homeScore),
  };
}
