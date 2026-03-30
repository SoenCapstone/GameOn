import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { MatchDetailsContent } from "@/components/matches/match-details-content";
import { MATCH_DETAILS_DEFAULTS } from "@/constants/match-details";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import {
  useCancelLeagueMatch,
  useCancelTeamMatch,
  useLeagueVenue,
  useLeaguesByIds,
  useLeagueMatches,
  useMatchMembersByTeam,
  useTeamVenue,
  useTeamMatch,
  useTeamMatches,
  useTeamsByIds,
  useUpdateMatchAttendance,
} from "@/hooks/use-matches";
import { useRefereeName } from "@/hooks/use-referee-name";
import { useTeamDetail } from "@/hooks/use-team-detail";
import type {
  MatchAttendanceAction,
  MatchDetailsDisplayMatch,
  MatchDetailsRouteParams,
} from "@/types/match-details";
import { errorToString } from "@/utils/error";
import {
  canUserCancelMatch,
  canUserSubmitMatchScore,
  getContextLabel,
  getMatchAttendanceAction,
  getIsMatchLoading,
  getMatchLeagueId,
  getMatchScores,
  getMatchTeamIds,
  isLeagueMatch,
} from "@/utils/match-details";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

function renderMatchLoadingState(
  isMatchLoading: boolean,
  displayMatch: MatchDetailsDisplayMatch | undefined,
) {
  if (isMatchLoading && !displayMatch) {
    return <Loading />;
  }

  return null;
}

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams<MatchDetailsRouteParams>();
  const matchId = params.id ?? "";
  const space = params.space;
  const spaceId = params.spaceId ?? "";
  const router = useRouter();

  const teamMatchQuery = useTeamMatch(space === "league" ? "" : matchId);
  const teamMatchesQuery = useTeamMatches(space === "team" ? spaceId : "");
  const leagueMatchesQuery = useLeagueMatches(
    space === "league" ? spaceId : "",
  );

  const teamListMatch =
    space === "team"
      ? teamMatchesQuery.data?.find((match) => match.id === matchId)
      : undefined;
  const leagueListMatch =
    space === "league"
      ? leagueMatchesQuery.data?.find((match) => match.id === matchId)
      : undefined;
  const displayMatch = teamMatchQuery.data ?? teamListMatch ?? leagueListMatch;

  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [hasSubmittedAttendance, setHasSubmittedAttendance] = useState(false);
  const leagueId =
    getMatchLeagueId(displayMatch) || (space === "league" ? spaceId : "");
  const { league, isOwner: isLeagueOwner } = useLeagueDetail(leagueId);
  const cancelLeagueMutation = useCancelLeagueMatch(leagueId);
  const cancelTeamMutation = useCancelTeamMatch();
  const attendanceMutation = useUpdateMatchAttendance();

  const teamIds = useMemo(() => getMatchTeamIds(displayMatch), [displayMatch]);
  const teamsQuery = useTeamsByIds(teamIds);
  const teamDetail = useTeamDetail(space === "team" ? spaceId : "");
  const matchMembersQuery = useMatchMembersByTeam(
    matchId,
    space === "team" ? spaceId : "",
  );
  const matchLeagueQuery = useLeaguesByIds(
    space !== "league" && leagueId ? [leagueId] : [],
  );
  const refereeNameQuery = useRefereeName(displayMatch?.refereeUserId);

  const canCancel = useMemo(
    () =>
      canUserCancelMatch({
        isLeagueOwner,
        match: displayMatch,
        teamSummaryMap: teamsQuery.data,
        userId,
      }),
    [displayMatch, isLeagueOwner, teamsQuery.data, userId],
  );
  const canSubmitScore = useMemo(
    () =>
      canUserSubmitMatchScore({
        match: displayMatch,
        teamSummaryMap: teamsQuery.data,
        userId,
      }),
    [displayMatch, teamsQuery.data, userId],
  );
  const persistedAttendanceStatus = matchMembersQuery.data?.find(
    (member) => member.userId === userId,
  )?.status;
  const hasRespondedToAttendance = useMemo(() => {
    if (hasSubmittedAttendance) {
      return true;
    }

    if (teamDetail.role === "REPLACEMENT") {
      return persistedAttendanceStatus === "CONFIRMED";
    }

    if (teamDetail.role === "PLAYER") {
      return persistedAttendanceStatus === "DECLINED";
    }

    return false;
  }, [hasSubmittedAttendance, persistedAttendanceStatus, teamDetail.role]);
  const homeTeam = displayMatch
    ? teamsQuery.data?.[displayMatch.homeTeamId]
    : undefined;
  const awayTeam = displayMatch
    ? teamsQuery.data?.[displayMatch.awayTeamId]
    : undefined;
  const homeTeamName =
    homeTeam?.name ??
    params.homeName?.trim() ??
    MATCH_DETAILS_DEFAULTS.homeTeamName;
  const awayTeamName =
    awayTeam?.name ??
    params.awayName?.trim() ??
    MATCH_DETAILS_DEFAULTS.awayTeamName;
  const homeTeamLogoUrl =
    homeTeam?.logoUrl ?? params.homeLogoUrl?.trim() ?? undefined;
  const awayTeamLogoUrl =
    awayTeam?.logoUrl ?? params.awayLogoUrl?.trim() ?? undefined;
  const attendanceAction = useMemo<MatchAttendanceAction | null>(() => {
    const action = getMatchAttendanceAction({
      attendanceStatus: persistedAttendanceStatus,
      hasResponded: hasRespondedToAttendance,
      isActiveMember: teamDetail.isActiveMember,
      match: displayMatch,
      role: teamDetail.role,
      space,
      spaceId,
    });

    if (!action) {
      return null;
    }

    return {
      ...action,
      title: `${homeTeamName} vs ${awayTeamName}`,
    };
  }, [
    awayTeamName,
    displayMatch,
    hasRespondedToAttendance,
    homeTeamName,
    persistedAttendanceStatus,
    space,
    spaceId,
    teamDetail.isActiveMember,
    teamDetail.role,
  ]);

  const onSubmitScore = useCallback(() => {
    if (!displayMatch || !canSubmitScore) {
      return;
    }

    router.push({
      pathname: `/match/${displayMatch.id}/score` as RelativePathString,
      params: {
        awayName: awayTeamName,
        homeName: homeTeamName,
        spaceId,
      },
    });
  }, [
    awayTeamName,
    canSubmitScore,
    displayMatch,
    homeTeamName,
    router,
    spaceId,
  ]);

  const onConfirmCancelMatch = useCallback(async () => {
    if (!displayMatch || !canCancel) {
      return;
    }

    try {
      if (isLeagueMatch(displayMatch)) {
        await cancelLeagueMutation.mutateAsync({ matchId: displayMatch.id });
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
      } else {
        await cancelTeamMutation.mutateAsync({ matchId: displayMatch.id });
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
    } catch (err) {
      Alert.alert("Cancel failed", errorToString(err));
    }
  }, [
    canCancel,
    cancelLeagueMutation,
    cancelTeamMutation,
    displayMatch,
    leagueId,
    queryClient,
    space,
    spaceId,
  ]);
  const onConfirmAttendanceAction = useCallback(async () => {
    if (!displayMatch || !attendanceAction || !spaceId) {
      return;
    }

    try {
      await attendanceMutation.mutateAsync({
        matchId: displayMatch.id,
        attending: attendanceAction.attending,
      });
      setHasSubmittedAttendance(true);
      await queryClient.invalidateQueries({
        queryKey: ["match-members-by-team", displayMatch.id, spaceId],
      });
    } catch (err) {
      Alert.alert("Attendance update failed", errorToString(err));
    }
  }, [attendanceAction, attendanceMutation, displayMatch, queryClient, spaceId]);

  const venueId = displayMatch?.venueId ?? "";
  const displayMatchIsLeague = isLeagueMatch(displayMatch);
  const teamVenueQuery = useTeamVenue(
    venueId,
    Boolean(venueId) && !displayMatchIsLeague,
  );
  const leagueVenueQuery = useLeagueVenue(
    venueId,
    Boolean(venueId) && displayMatchIsLeague,
  );
  const venue = displayMatchIsLeague
    ? leagueVenueQuery.data
    : teamVenueQuery.data;
  const { homeScore, awayScore } = getMatchScores(displayMatch);
  const contextLabel = getContextLabel({
    leagueName: league?.name,
    matchLeagueName: matchLeagueQuery.data?.[leagueId]?.name,
    space,
  });
  const isMatchLoading = getIsMatchLoading({
    directMatchLoading: teamMatchQuery.isLoading,
    leagueMatchesLoading: leagueMatchesQuery.isLoading,
    space,
    teamMatchesLoading: teamMatchesQuery.isLoading,
  });
  const loadingState = renderMatchLoadingState(isMatchLoading, displayMatch);

  if (loadingState) {
    return loadingState;
  }

  if (!displayMatch) {
    return <Empty message="Match not found" />;
  }

  return (
    <MatchDetailsContent
      startTime={displayMatch.startTime}
      status={displayMatch.status}
      attendanceAction={attendanceAction}
      onConfirmAttendanceAction={
        attendanceAction ? onConfirmAttendanceAction : undefined
      }
      canCancelMatch={canCancel}
      onConfirmCancelMatch={canCancel ? onConfirmCancelMatch : undefined}
      canSubmitScore={canSubmitScore}
      onSubmitScore={canSubmitScore ? onSubmitScore : undefined}
      homeTeamName={homeTeamName}
      awayTeamName={awayTeamName}
      homeScore={homeScore}
      awayScore={awayScore}
      homeTeamLogoUrl={homeTeamLogoUrl}
      awayTeamLogoUrl={awayTeamLogoUrl}
      sport={displayMatch.sport}
      contextLabel={contextLabel}
      refereeName={refereeNameQuery.data ?? undefined}
      venueName={venue?.name ?? displayMatch.matchLocation}
      venueLocationLabel={venue ? `${venue.city}, ${venue.province}` : null}
      venueAddress={
        venue
          ? `${venue.street}, ${venue.city}, ${venue.province} ${venue.postalCode}, ${venue.country}`
          : null
      }
      venueLatitude={venue?.latitude}
      venueLongitude={venue?.longitude}
    />
  );
}
