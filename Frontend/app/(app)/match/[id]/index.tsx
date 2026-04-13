import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  RelativePathString,
  Color,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { Image } from "expo-image";
import MapView, { Marker } from "react-native-maps";
import { toast } from "@/utils/toast";
import { useAuth } from "@clerk/clerk-expo";
import { useQueryClient } from "@tanstack/react-query";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import {
  useCancelLeagueMatch,
  useCancelTeamMatch,
  useLeagueMatch,
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
  MatchDetailsRouteParams,
  MatchSpace,
  MatchToolbarProps,
} from "@/types/match-details";
import { errorToString } from "@/utils/error";
import {
  canUserCancelMatch,
  cancelMatch,
  canUserSubmitMatchScore,
  getDirectLeagueMatchId,
  getContextLabel,
  getDisplayMatch,
  getMatchAttendanceActionWithTitle,
  getIsMatchLoading,
  getMatchScores,
  getMatchTeamIds,
  getMatchToolbarVisibility,
  getMatchVenuePresentation,
  getResolvedMatchLeagueId,
  getTeamSpaceId,
  getTeamPresentation,
  hasRespondedToAttendance,
  isLeagueMatch,
  openMatchVenueDirections,
  showCancelMatchConfirm as showCancelMatchConfirmPrompt,
  showMatchAttendanceConfirm,
  showMatchVenueDirectionsPrompt,
  submitMatchAttendance,
} from "@/utils/match-details";
import { getSportLogo } from "@/utils/search";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { usePostHogFlags } from "@/hooks/use-posthog-flags";
import { usePostHog } from "posthog-react-native";
import {
  formatMatchDate,
  formatMatchDateTime,
  isCancelledMatchStatus,
} from "@/utils/matches";

function MatchToolbar({
  attendanceAction,
  onCancelMatch,
  onOpenInMaps,
  onSubmitScore,
  onUpdateAttendance,
  showAttendanceInMenu,
  showCancelInMenu,
  showMatchScoreInMenu,
  showMenu,
}: Readonly<MatchToolbarProps>) {
  return (
    <Stack.Toolbar placement="bottom">
      {showMenu ? (
        <Stack.Toolbar.Menu
          icon="ellipsis"
          variant="prominent"
          tintColor={Color.ios.quaternarySystemFill}
        >
          {showAttendanceInMenu ? (
            <Stack.Toolbar.Menu
              title="Attendance"
              icon="person.fill.checkmark.and.xmark"
            >
              <Stack.Toolbar.MenuAction
                icon={attendanceAction?.icon}
                destructive={attendanceAction?.destructive}
                onPress={onUpdateAttendance}
              >
                {attendanceAction?.label}
              </Stack.Toolbar.MenuAction>
            </Stack.Toolbar.Menu>
          ) : null}
          {showMatchScoreInMenu ? (
            <Stack.Toolbar.MenuAction icon="rosette" onPress={onSubmitScore}>
              Match Score
            </Stack.Toolbar.MenuAction>
          ) : null}
          {showCancelInMenu ? (
            <Stack.Toolbar.MenuAction
              icon="xmark"
              destructive
              onPress={onCancelMatch}
            >
              Cancel Match
            </Stack.Toolbar.MenuAction>
          ) : null}
        </Stack.Toolbar.Menu>
      ) : null}
      <Stack.Toolbar.Spacer />
      <Stack.Toolbar.Button
        variant="prominent"
        tintColor={Color.ios.quaternarySystemFill}
        onPress={onOpenInMaps}
      >
        Open in Maps
      </Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
}

function MatchSummary({
  awayScore,
  awayTeamLogoUrl,
  awayTeamName,
  contextLabel,
  hasScore,
  homeScore,
  homeTeamLogoUrl,
  homeTeamName,
  isCancelled,
  sport,
  startTime,
}: Readonly<{
  awayScore?: number | null;
  awayTeamLogoUrl?: string;
  awayTeamName: string;
  contextLabel: string;
  hasScore: boolean;
  homeScore?: number | null;
  homeTeamLogoUrl?: string;
  homeTeamName: string;
  isCancelled: boolean;
  sport?: string | null;
  startTime: string;
}>) {
  return (
    <View style={styles.summary}>
      <View style={styles.top}>
        <Image
          source={
            homeTeamLogoUrl ? { uri: homeTeamLogoUrl } : getSportLogo(sport)
          }
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.center}>
          {hasScore && !isCancelled ? (
            <Text style={[styles.score, styles.leftscore]}>{homeScore}</Text>
          ) : null}

          <View style={styles.middle}>
            <Text style={styles.context} numberOfLines={1}>
              {contextLabel}
            </Text>
            {isCancelled ? (
              <Text style={styles.pending}>Cancelled</Text>
            ) : (
              <Text style={styles.date}>
                {hasScore
                  ? formatMatchDate(startTime)
                  : formatMatchDateTime(startTime)}
              </Text>
            )}
          </View>

          {hasScore && !isCancelled ? (
            <Text style={[styles.score, styles.rightscore]}>{awayScore}</Text>
          ) : null}
        </View>

        <Image
          source={
            awayTeamLogoUrl ? { uri: awayTeamLogoUrl } : getSportLogo(sport)
          }
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.names}>
        <View style={styles.home}>
          <Text style={styles.name} numberOfLines={1}>
            {homeTeamName}
          </Text>
        </View>
        <View style={styles.away}>
          <Text style={styles.name} numberOfLines={1}>
            {awayTeamName}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MatchMeta({
  hasReferee,
  hasVenue,
  refereeName,
  venueMetaLabel,
}: Readonly<{
  hasReferee: boolean;
  hasVenue: boolean;
  refereeName?: string | null;
  venueMetaLabel?: string | null;
}>) {
  return (
    <View style={styles.metaBlock}>
      {hasVenue ? (
        <View style={styles.metaRow}>
          <IconSymbol name="mappin.and.ellipse" color="727272" size={18} />
          <View style={styles.metaTextRow}>
            <Text style={styles.meta}>Venue:</Text>
            <Text style={styles.metaWhite} numberOfLines={2}>
              {venueMetaLabel}
            </Text>
          </View>
        </View>
      ) : null}
      {hasReferee ? (
        <View style={styles.metaRow}>
          <IconSymbol name="flag.fill" color="727272" size={15} />
          <View style={styles.metaTextRow}>
            <Text style={styles.meta}>Referee:</Text>
            <Text style={styles.metaWhite}>{refereeName}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function getMatchDetailsPlaceholder(args: {
  displayMatch?: ReturnType<typeof getDisplayMatch>;
  isMatchLoading: boolean;
}) {
  const { displayMatch, isMatchLoading } = args;

  if (isMatchLoading && !displayMatch) {
    return <Loading />;
  }

  if (!displayMatch) {
    return <Empty message="Match not found" />;
  }

  return null;
}

function pushMatchScoreRoute(args: {
  awayTeamName: string;
  canSubmitScore: boolean;
  homeTeamName: string;
  leagueId?: string;
  matchId?: string;
  router: ReturnType<typeof useRouter>;
  space?: MatchSpace;
  spaceId: string;
  startTime?: string;
}) {
  const {
    awayTeamName,
    canSubmitScore,
    homeTeamName,
    leagueId,
    matchId,
    router,
    space,
    spaceId,
    startTime,
  } = args;

  if (!matchId || !canSubmitScore) {
    return;
  }

  router.push({
    pathname: `/match/${matchId}/score` as RelativePathString,
    params: {
      awayName: awayTeamName,
      homeName: homeTeamName,
      leagueId,
      space,
      spaceId,
      startTime,
    },
  });
}

export default function MatchScreen() {
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
  const fallbackDisplayMatch = getDisplayMatch({
    leagueMatches: leagueMatchesQuery.data,
    matchId,
    space,
    teamMatch: teamMatchQuery.data,
    teamMatches: teamMatchesQuery.data,
  });
  const directLeagueMatchId = getDirectLeagueMatchId({
    fallbackDisplayMatch,
    space,
    spaceId,
  });
  const leagueMatchQuery = useLeagueMatch(
    directLeagueMatchId,
    matchId,
    Boolean(directLeagueMatchId),
  );

  const displayMatch = getDisplayMatch({
    leagueMatch: leagueMatchQuery.data,
    leagueMatches: leagueMatchesQuery.data,
    matchId,
    space,
    teamMatch: teamMatchQuery.data,
    teamMatches: teamMatchesQuery.data,
  });

  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const [hasSubmittedAttendance, setHasSubmittedAttendance] = useState(false);
  const teamSpaceId = getTeamSpaceId(space, spaceId);
  const leagueId = getResolvedMatchLeagueId({
    displayMatch,
    space,
    spaceId,
  });
  const { league, isOwner: isLeagueOwner } = useLeagueDetail(leagueId);
  const cancelLeagueMutation = useCancelLeagueMatch(leagueId);
  const cancelTeamMutation = useCancelTeamMatch();
  const attendanceMutation = useUpdateMatchAttendance();

  const teamIds = useMemo(() => getMatchTeamIds(displayMatch), [displayMatch]);
  const teamsQuery = useTeamsByIds(teamIds);
  const teamDetail = useTeamDetail(teamSpaceId);
  const matchMembersQuery = useMatchMembersByTeam(matchId, teamSpaceId);
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
  const { canSubmitScore: canSubmitScoreFlag } = usePostHogFlags();
  const canSubmitScore = useMemo(
    () =>
      canSubmitScoreFlag &&
      canUserSubmitMatchScore({
        match: displayMatch,
        teamSummaryMap: teamsQuery.data,
        userId,
      }),
    [canSubmitScoreFlag, displayMatch, teamsQuery.data, userId],
  );
  const persistedAttendanceStatus = matchMembersQuery.data?.find(
    (member) => member.userId === userId,
  )?.status;
  const hasResponded = useMemo(
    () =>
      hasRespondedToAttendance({
        hasSubmittedAttendance,
        persistedAttendanceStatus,
        role: teamDetail.role,
      }),
    [hasSubmittedAttendance, persistedAttendanceStatus, teamDetail.role],
  );
  const { homeTeamName, awayTeamName, homeTeamLogoUrl, awayTeamLogoUrl } =
    getTeamPresentation({
      awayLogoUrl: params.awayLogoUrl,
      awayName: params.awayName,
      displayMatch,
      homeLogoUrl: params.homeLogoUrl,
      homeName: params.homeName,
      teamSummaryMap: teamsQuery.data,
    });
  const attendanceAction = useMemo(
    () =>
      getMatchAttendanceActionWithTitle({
        attendanceStatus: persistedAttendanceStatus,
        awayTeamName,
        displayMatch,
        hasResponded,
        homeTeamName,
        isActiveMember: teamDetail.isActiveMember,
        role: teamDetail.role,
        space,
        spaceId,
      }),
    [
      awayTeamName,
      displayMatch,
      hasResponded,
      homeTeamName,
      persistedAttendanceStatus,
      space,
      spaceId,
      teamDetail.isActiveMember,
      teamDetail.role,
    ],
  );

  useEffect(() => {
    if (!displayMatch) return;
    posthog.capture("match_viewed", {
      match_id: displayMatch.id,
      space,
    });
  }, [displayMatch, posthog, space]);

  const onSubmitScore = useCallback(() => {
    posthog.capture("match_submit_score_tapped", {
      match_id: displayMatch?.id,
      space,
    });
    pushMatchScoreRoute({
      awayTeamName,
      canSubmitScore,
      homeTeamName,
      leagueId: isLeagueMatch(displayMatch) ? displayMatch.leagueId : undefined,
      matchId: displayMatch?.id,
      router,
      space,
      spaceId,
      startTime: displayMatch?.startTime,
    });
  }, [
    awayTeamName,
    canSubmitScore,
    displayMatch,
    homeTeamName,
    posthog,
    router,
    space,
    spaceId,
  ]);

  const onConfirmCancelMatch = useCallback(async () => {
    posthog.capture("match_cancelled", {
      match_id: displayMatch?.id,
      space,
    });
    try {
      await cancelMatch({
        canCancel,
        cancelLeagueMatch: cancelLeagueMutation.mutateAsync,
        cancelTeamMatch: cancelTeamMutation.mutateAsync,
        displayMatch,
        leagueId,
        queryClient,
        space,
        spaceId,
      });
    } catch (err) {
      toast.error("Cancel Failed", {
        description: errorToString(err),
      });
    }
  }, [
    canCancel,
    cancelLeagueMutation,
    cancelTeamMutation,
    displayMatch,
    leagueId,
    posthog,
    queryClient,
    space,
    spaceId,
  ]);
  const onConfirmAttendanceAction = useCallback(async () => {
    posthog.capture("match_attendance_updated", {
      match_id: displayMatch?.id,
      action: attendanceAction?.label,
      space,
    });
    try {
      await submitMatchAttendance({
        attendanceAction,
        displayMatch,
        queryClient,
        setHasSubmittedAttendance,
        spaceId,
        updateAttendance: attendanceMutation.mutateAsync,
      });
    } catch (err) {
      toast.error("Attendance Update Failed", {
        description: errorToString(err),
      });
    }
  }, [
    attendanceAction,
    attendanceMutation,
    displayMatch,
    posthog,
    queryClient,
    setHasSubmittedAttendance,
    space,
    spaceId,
  ]);

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
    leagueMatchLoading: leagueMatchQuery.isLoading,
    directMatchLoading: teamMatchQuery.isLoading,
    leagueMatchesLoading: leagueMatchesQuery.isLoading,
    space,
    teamMatchesLoading: teamMatchesQuery.isLoading,
  });
  const hasScore = homeScore != null && awayScore != null;
  const isCancelled = displayMatch
    ? isCancelledMatchStatus(displayMatch.status)
    : false;
  const { hasCoordinates, hasVenue, mapRegion, venueMetaLabel } =
    getMatchVenuePresentation({
      displayMatch,
      venue,
    });
  const hasReferee = Boolean(refereeNameQuery.data?.trim());
  const {
    showAttendanceInMenu,
    showCancelInMenu,
    showMatchScoreInMenu,
    showMenu,
  } = getMatchToolbarVisibility({
    attendanceAction,
    canCancel,
    canSubmitScore,
    hasDisplayMatch: Boolean(displayMatch),
    hasScore,
    isCancelled,
  });
  const placeholder = getMatchDetailsPlaceholder({
    displayMatch,
    isMatchLoading,
  });

  const openVenueDirections = useCallback(async () => {
    await openMatchVenueDirections({
      hasCoordinates,
      matchLocation: displayMatch?.matchLocation,
      venue,
    });
  }, [displayMatch?.matchLocation, hasCoordinates, venue]);

  const handleMapPress = useCallback(() => {
    showMatchVenueDirectionsPrompt({
      matchLocation: displayMatch?.matchLocation,
      onOpen: () => {
        void openVenueDirections();
      },
      venueName: venue?.name,
    });
  }, [displayMatch?.matchLocation, openVenueDirections, venue?.name]);

  const showAttendanceConfirm = useCallback(() => {
    showMatchAttendanceConfirm({
      attendanceAction,
      onConfirm: () => {
        void onConfirmAttendanceAction();
      },
    });
  }, [attendanceAction, onConfirmAttendanceAction]);

  const showCancelMatchConfirm = useCallback(() => {
    showCancelMatchConfirmPrompt(() => {
      void onConfirmCancelMatch();
    });
  }, [onConfirmCancelMatch]);

  if (!displayMatch) {
    return placeholder ?? <Empty message="Match not found" />;
  }

  return (
    <>
      <MatchToolbar
        attendanceAction={attendanceAction}
        onCancelMatch={showCancelMatchConfirm}
        onOpenInMaps={handleMapPress}
        onSubmitScore={onSubmitScore}
        onUpdateAttendance={showAttendanceConfirm}
        showAttendanceInMenu={showAttendanceInMenu}
        showCancelInMenu={showCancelInMenu}
        showMatchScoreInMenu={showMatchScoreInMenu}
        showMenu={showMenu}
      />
      <View style={styles.container}>
        <MatchSummary
          awayScore={awayScore}
          awayTeamLogoUrl={awayTeamLogoUrl}
          awayTeamName={awayTeamName}
          contextLabel={contextLabel}
          hasScore={hasScore}
          homeScore={homeScore}
          homeTeamLogoUrl={homeTeamLogoUrl}
          homeTeamName={homeTeamName}
          isCancelled={isCancelled}
          sport={displayMatch.sport}
          startTime={displayMatch.startTime}
        />

        <View style={styles.view}>
          <MapView
            style={styles.map}
            mapPadding={{ top: 8, right: 8, bottom: 8, left: 8 }}
            region={mapRegion}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {mapRegion ? (
              <Marker
                coordinate={{
                  latitude: mapRegion.latitude,
                  longitude: mapRegion.longitude,
                }}
              />
            ) : null}
          </MapView>
        </View>

        <MatchMeta
          hasReferee={hasReferee}
          hasVenue={hasVenue}
          refereeName={refereeNameQuery.data}
          venueMetaLabel={venueMetaLabel}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 44,
    paddingHorizontal: 10,
  },
  summary: {
    gap: 10,
    paddingHorizontal: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  logo: {
    width: 54,
    height: 54,
  },
  center: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  middle: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "55%",
  },
  context: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 14,
    textAlign: "center",
  },
  date: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 14,
    textAlign: "center",
  },
  score: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 28,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    width: 36,
    textAlign: "center",
  },
  leftscore: {
    marginRight: 6,
  },
  rightscore: {
    marginLeft: 6,
  },
  pending: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 14,
    textAlign: "center",
  },
  names: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  home: {
    minWidth: 98,
    alignItems: "center",
  },
  away: {
    minWidth: 98,
    alignItems: "center",
  },
  name: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  view: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(108,108,113,0.35)",
    borderRadius: 34,
    marginTop: 30,
    marginBottom: 14,
  },
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    overflow: "hidden",
  },
  metaBlock: {
    paddingHorizontal: 16,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  metaTextRow: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  metaWhite: {
    color: "white",
    fontSize: 14,
    flexShrink: 1,
  },
  meta: {
    color: "#727272",
    fontSize: 14,
  },
});
