import { Alert, Linking } from "react-native";
import { QueryClient } from "@tanstack/react-query";
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
import type { Venue } from "@/types/matches";
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

export function getDisplayMatch(args: {
  leagueMatches?: MatchDetailsDisplayMatch[];
  matchId: string;
  space?: MatchSpace;
  teamMatch?: MatchDetailsDisplayMatch;
  teamMatches?: MatchDetailsDisplayMatch[];
}) {
  const { leagueMatches, matchId, space, teamMatch, teamMatches } = args;

  const teamListMatch =
    space === "team"
      ? teamMatches?.find((match) => match.id === matchId)
      : undefined;
  const leagueListMatch =
    space === "league"
      ? leagueMatches?.find((match) => match.id === matchId)
      : undefined;

  return teamMatch ?? teamListMatch ?? leagueListMatch;
}

export function hasRespondedToAttendance(args: {
  hasSubmittedAttendance: boolean;
  persistedAttendanceStatus?: MatchMemberAttendanceStatus | null;
  role?: string | null;
}) {
  const { hasSubmittedAttendance, persistedAttendanceStatus, role } = args;

  if (hasSubmittedAttendance) {
    return true;
  }

  if (role === "REPLACEMENT") {
    return persistedAttendanceStatus === "CONFIRMED";
  }

  if (role === "PLAYER") {
    return persistedAttendanceStatus === "DECLINED";
  }

  return false;
}

export function getTeamPresentation(args: {
  awayLogoUrl?: string;
  awayName?: string;
  displayMatch?: MatchDetailsDisplayMatch;
  homeLogoUrl?: string;
  homeName?: string;
  teamSummaryMap?: MatchTeamSummaryMap;
}) {
  const {
    awayLogoUrl,
    awayName,
    displayMatch,
    homeLogoUrl,
    homeName,
    teamSummaryMap,
  } = args;
  const homeTeam = displayMatch
    ? teamSummaryMap?.[displayMatch.homeTeamId]
    : undefined;
  const awayTeam = displayMatch
    ? teamSummaryMap?.[displayMatch.awayTeamId]
    : undefined;

  return {
    awayTeamLogoUrl: awayTeam?.logoUrl ?? awayLogoUrl?.trim() ?? undefined,
    awayTeamName:
      awayTeam?.name ?? awayName?.trim() ?? MATCH_DETAILS_DEFAULTS.awayTeamName,
    homeTeamLogoUrl: homeTeam?.logoUrl ?? homeLogoUrl?.trim() ?? undefined,
    homeTeamName:
      homeTeam?.name ?? homeName?.trim() ?? MATCH_DETAILS_DEFAULTS.homeTeamName,
  };
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

export function getMatchAttendanceActionWithTitle(args: {
  attendanceStatus?: MatchMemberAttendanceStatus | null;
  awayTeamName: string;
  displayMatch?: MatchDetailsDisplayMatch;
  hasResponded: boolean;
  homeTeamName: string;
  isActiveMember?: boolean;
  role?: string | null;
  space?: MatchSpace;
  spaceId: string;
}): MatchAttendanceAction | null {
  const action = getMatchAttendanceAction({
    attendanceStatus: args.attendanceStatus,
    hasResponded: args.hasResponded,
    isActiveMember: args.isActiveMember,
    match: args.displayMatch,
    role: args.role,
    space: args.space,
    spaceId: args.spaceId,
  });

  if (!action) {
    return null;
  }

  return {
    ...action,
    title: `${args.homeTeamName} vs ${args.awayTeamName}`,
  };
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

export function getMatchVenuePresentation(args: {
  displayMatch?: MatchDetailsDisplayMatch;
  venue?: Venue | null;
}) {
  const { displayMatch, venue } = args;
  const venueLatitude =
    typeof venue?.latitude === "number" ? venue.latitude : undefined;
  const venueLongitude =
    typeof venue?.longitude === "number" ? venue.longitude : undefined;
  const hasCoordinates =
    venueLatitude !== undefined && venueLongitude !== undefined;
  const hasVenue = Boolean(
    venue?.name?.trim() || displayMatch?.matchLocation?.trim(),
  );
  const venueMetaLabel = venue?.name?.trim()
    ? venue.city?.trim()
      ? `${venue.name}, ${venue.city}, ${venue.province}`
      : venue.name
    : displayMatch?.matchLocation ?? null;
  const mapRegion = hasCoordinates
    ? {
        latitude: venueLatitude,
        longitude: venueLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : undefined;

  return {
    hasCoordinates,
    hasVenue,
    mapRegion,
    venueMetaLabel,
  };
}

export function getMatchToolbarVisibility(args: {
  attendanceAction?: MatchAttendanceAction | null;
  canCancel: boolean;
  canSubmitScore: boolean;
  hasDisplayMatch: boolean;
  isCancelled: boolean;
}) {
  const {
    attendanceAction,
    canCancel,
    canSubmitScore,
    hasDisplayMatch,
    isCancelled,
  } = args;
  const showCancelInMenu = canCancel && !isCancelled && hasDisplayMatch;
  const showAttendanceInMenu = Boolean(attendanceAction);
  const showMatchScoreInMenu = canSubmitScore;

  return {
    showAttendanceInMenu,
    showCancelInMenu,
    showMatchScoreInMenu,
    showMenu:
      showAttendanceInMenu || showMatchScoreInMenu || showCancelInMenu,
  };
}

export async function cancelMatch(args: {
  canCancel: boolean;
  cancelLeagueMatch: (args: { matchId: string }) => Promise<unknown>;
  cancelTeamMatch: (args: { matchId: string }) => Promise<unknown>;
  displayMatch?: MatchDetailsDisplayMatch;
  leagueId: string;
  queryClient: QueryClient;
  space?: MatchSpace;
  spaceId: string;
}) {
  const {
    canCancel,
    cancelLeagueMatch,
    cancelTeamMatch,
    displayMatch,
    leagueId,
    queryClient,
    space,
    spaceId,
  } = args;

  if (!displayMatch || !canCancel) {
    return;
  }

  if (isLeagueMatch(displayMatch)) {
    await cancelLeagueMatch({ matchId: displayMatch.id });
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["league-matches", leagueId],
      }),
      space === "team" && spaceId
        ? queryClient.invalidateQueries({
            queryKey: ["team-matches", spaceId],
          })
        : Promise.resolve(),
    ]);
    return;
  }

  await cancelTeamMatch({ matchId: displayMatch.id });
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["team-match", displayMatch.id],
    }),
    spaceId
      ? queryClient.invalidateQueries({
          queryKey: ["team-matches", spaceId],
        })
      : Promise.resolve(),
  ]);
}

export async function submitMatchAttendance(args: {
  attendanceAction?: MatchAttendanceAction | null;
  displayMatch?: MatchDetailsDisplayMatch;
  queryClient: QueryClient;
  setHasSubmittedAttendance: (value: boolean) => void;
  spaceId: string;
  updateAttendance: (args: {
    matchId: string;
    attending: MatchAttendanceAction["attending"];
  }) => Promise<unknown>;
}) {
  const {
    attendanceAction,
    displayMatch,
    queryClient,
    setHasSubmittedAttendance,
    spaceId,
    updateAttendance,
  } = args;

  if (!displayMatch || !attendanceAction || !spaceId) {
    return;
  }

  await updateAttendance({
    matchId: displayMatch.id,
    attending: attendanceAction.attending,
  });
  setHasSubmittedAttendance(true);
  await queryClient.invalidateQueries({
    queryKey: ["match-members-by-team", displayMatch.id, spaceId],
  });
}

export async function openMatchVenueDirections(args: {
  hasCoordinates: boolean;
  matchLocation?: string | null;
  venue?: Venue | null;
}) {
  const { hasCoordinates, matchLocation, venue } = args;
  const venueLabel = venue?.name ?? matchLocation ?? "Venue";
  const label = encodeURIComponent(venueLabel);
  const query = encodeURIComponent(venue?.name?.trim() || matchLocation?.trim() || "Venue");
  const appleMapsUrl =
    hasCoordinates && venue
      ? `https://maps.apple.com/?daddr=${venue.latitude},${venue.longitude}&q=${label}`
      : `https://maps.apple.com/?daddr=${query}`;

  const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
  if (canOpenAppleMaps) {
    await Linking.openURL(appleMapsUrl);
    return;
  }

  Alert.alert(
    "Maps unavailable",
    "Could not open Apple Maps for directions on this device.",
  );
}

export function showMatchVenueDirectionsPrompt(args: {
  matchLocation?: string | null;
  onOpen: () => void;
  venueName?: string | null;
}) {
  const { matchLocation, onOpen, venueName } = args;

  if (!venueName && !matchLocation) {
    return;
  }

  Alert.alert("Open in Maps", "Do you want to open this venue in Maps?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Open",
      onPress: onOpen,
    },
  ]);
}

export function showMatchAttendanceConfirm(args: {
  attendanceAction?: MatchAttendanceAction | null;
  onConfirm: () => void;
}) {
  const { attendanceAction, onConfirm } = args;

  if (!attendanceAction) {
    return;
  }

  Alert.alert(attendanceAction.title, attendanceAction.message, [
    { text: "Cancel", style: "cancel" },
    {
      text: attendanceAction.confirmLabel,
      style: attendanceAction.destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}

export function showCancelMatchConfirm(onConfirm: () => void) {
  Alert.alert("Cancel match", "Are you sure you want to cancel this match?", [
    { text: "Keep", style: "cancel" },
    {
      text: "Cancel Match",
      style: "destructive",
      onPress: onConfirm,
    },
  ]);
}
