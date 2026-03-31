import { useCallback, useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import { getSportLogo } from "@/components/browse/utils";
import { useTeamHeader } from "@/hooks/use-team-league-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamBoardPosts, useDeleteBoardPost } from "@/hooks/use-team-board";
import { BoardList } from "@/components/board/board-list";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { createScopedLog } from "@/utils/logger";
import { useTeamOverview } from "@/hooks/use-team-overview";
import { Tabs } from "@/components/ui/tabs";
import { MatchListSections } from "@/components/matches/match-list-sections";
import {
  useCancelTeamMatch,
  useLeaguesByIds,
  useTeamMatches,
  useTeamsByIds,
  useUpdateMatchAttendance,
} from "@/hooks/use-matches";
import { GO_MATCH_ROUTES, useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { buildMatchCards, splitMatchSections } from "@/features/matches/utils";
import { TeamOverviewTab } from "@/components/teams/team-overview-tab";
import { errorToString } from "@/utils/error";

type TeamTab = "board" | "matches" | "overview";
type AttendanceStatus = "CONFIRMED" | "DECLINED";

type TeamMatchMemberResponse = {
  id: string;
  teamId: string;
  userId: string;
  role: "OWNER" | "MANAGER" | "PLAYER" | "COACH" | "REPLACEMENT";
  status: "CONFIRMED" | "DECLINED" | "PENDING";
};

const TeamTabs: readonly TeamTab[] = ["board", "matches", "overview"] as const;

const TeamTabLabels: Record<TeamTab, string> = {
  board: "Board",
  matches: "Matches",
  overview: "Overview",
};

function getAttendanceDialogContent(isReplacement: boolean) {
  return {
    attending: isReplacement ? "CONFIRMED" : "DECLINED",
    title: isReplacement ? "Confirm attendance" : "Opt out",
    message: isReplacement
      ? "Are you sure you will be attending this match?"
      : "Are you sure you won't be attending this match?",
    buttonText: isReplacement ? "Attending" : "Not attending",
    buttonStyle: isReplacement ? "default" : "destructive",
  } as const;
}

export default function Team() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={id}>
      <TeamContent />
    </TeamDetailProvider>
  );
}

function TeamContent() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: TeamTab = parseTeamTab(params.tab);
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const router = useRouter();
  const log = createScopedLog("Team Page");
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const api = useAxiosWithClerk();

  const {
    id,
    isLoading,
    onRefresh,
    handleFollow,
    title,
    isOwner,
    isMember,
    isActiveMember,
    role,
    team,
  } = useTeamDetailContext();
  const canManage =
    isActiveMember &&
    (role === "OWNER" || role === "COACH" || role === "MANAGER");

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const deletePostMutation = useDeleteBoardPost(id);

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useTeamOverview(id);
  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useTeamMatches(id);
  const cancelTeamMutation = useCancelTeamMatch();
  const attendanceMutation = useUpdateMatchAttendance();
  const [respondedMatchIds, setRespondedMatchIds] = useState<Set<string>>(
    new Set(),
  );

  const markMatchAsResponded = useCallback((matchId: string) => {
    setRespondedMatchIds((prev) => new Set(prev).add(matchId));
  }, []);

  const matchMembersQueries = useQueries({
    queries: matches.map((match) => ({
      queryKey: ["match-members-by-team", match.id, id],
      queryFn: async () => {
        const resp = await api.get<TeamMatchMemberResponse[]>(
          GO_MATCH_ROUTES.MATCH_MEMBERS_BY_TEAM(match.id, id),
        );
        return resp.data ?? [];
      },
      enabled: Boolean(id && match.id && isActiveMember && userId),
      retry: false,
    })),
  });

  const matchMembersByMatchId = useMemo(
    () =>
      Object.fromEntries(
        matches.map((match, index) => [
          match.id,
          (matchMembersQueries[index]?.data ?? []) as TeamMatchMemberResponse[],
        ]),
      ) as Record<string, TeamMatchMemberResponse[]>,
    [matches, matchMembersQueries],
  );

  const submitAttendanceResponse = useCallback(
    async (matchId: string, attending: AttendanceStatus) => {
      try {
        await attendanceMutation.mutateAsync({ matchId, attending });
        markMatchAsResponded(matchId);
        await queryClient.invalidateQueries({
          queryKey: ["match-members-by-team", matchId, id],
        });
      } catch (err) {
        Alert.alert("Error", errorToString(err));
      }
    },
    [attendanceMutation, markMatchAsResponded, queryClient, id],
  );

  const openAttendanceDialog = useCallback(
    (matchId: string, isReplacement: boolean) => {
      const { attending, title, message, buttonText, buttonStyle } =
        getAttendanceDialogContent(isReplacement);

      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: buttonText,
          style: buttonStyle,
          onPress: async () => {
            await submitAttendanceResponse(matchId, attending);
          },
        },
      ]);
    },
    [submitAttendanceResponse],
  );

  const teamIds = useMemo(
    () =>
      Array.from(new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))),
    [matches],
  );
  const leagueIds = useMemo(
    () =>
      Array.from(
        new Set(
          matches.flatMap((match) =>
            "leagueId" in match && match.leagueId ? [match.leagueId] : [],
          ),
        ),
      ),
    [matches],
  );
  const teamsQuery = useTeamsByIds(teamIds);
  const leaguesQuery = useLeaguesByIds(leagueIds);

  const matchItems = useMemo(() => {
    const items = buildMatchCards(matches, teamsQuery.data, (match) => {
      if ("leagueId" in match && match.leagueId) {
        return leaguesQuery.data?.[match.leagueId]?.name ?? "League Match";
      }
      return "Team Match";
    });

    return items.map((match) => {
      const isLeagueMatch = "leagueId" in match && Boolean(match.leagueId);
      const homeOwnerId = teamsQuery.data?.[match.homeTeamId]?.ownerUserId;
      const awayOwnerId = teamsQuery.data?.[match.awayTeamId]?.ownerUserId;
      const isConfirmed = match.status === "CONFIRMED";
      const canCancel = Boolean(
        !isLeagueMatch &&
          userId &&
          !match.isPast &&
          match.status !== "CANCELLED" &&
          ((homeOwnerId && homeOwnerId === userId) ||
            (awayOwnerId && awayOwnerId === userId)),
      );
      const isOwner = Boolean(
        (homeOwnerId && homeOwnerId === userId) ||
          (awayOwnerId && awayOwnerId === userId),
      );
      const canSubmitScore = Boolean(
        userId &&
          isConfirmed &&
          (match.requiresReferee ? match.refereeUserId === userId : isOwner),
      );

      const persistedStatus = matchMembersByMatchId[match.id]?.find(
        (member) => member.userId === String(userId),
      )?.status;

      const isReplacement = role === "REPLACEMENT";

      const alreadyRespondedPersisted = isReplacement
        ? persistedStatus === "CONFIRMED"
        : persistedStatus === "DECLINED";

      const isEligibleRole = role === "PLAYER" || role === "REPLACEMENT";

      const canOptOut = Boolean(
        isEligibleRole &&
          isActiveMember &&
          !match.isPast &&
          match.status !== "CANCELLED" &&
          !respondedMatchIds.has(match.id) &&
          !alreadyRespondedPersisted,
      );

      return {
        ...match,
        canCancel,
        canSubmitScore,
        onConfirmCancel: canCancel
          ? async () => {
              try {
                await cancelTeamMutation.mutateAsync({ matchId: match.id });
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: ["team-match", match.id],
                  }),
                  queryClient.invalidateQueries({
                    queryKey: ["team-matches", id],
                  }),
                ]);
              } catch (err) {
                Alert.alert("Cancel failed", errorToString(err));
              }
            }
          : undefined,
        onSubmitScore: canSubmitScore
          ? () => {
              router.push({
                pathname: `/match/${match.id}/score` as RelativePathString,
                params: {
                  contextId: id,
                  contextType: "team",
                  leagueId: isLeagueMatch ? match.leagueId : undefined,
                  startTime: match.startTime,
                  homeName: match.homeName,
                  awayName: match.awayName,
                },
              });
            }
          : undefined,
        canOptOut,
        isReplacement,
        onOptOut: canOptOut
          ? () => openAttendanceDialog(match.id, isReplacement)
          : undefined,
      };
    });
  }, [
    matches,
    teamsQuery.data,
    leaguesQuery.data,
    userId,
    cancelTeamMutation,
    queryClient,
    id,
    router,
    isActiveMember,
    role,
    respondedMatchIds,
    openAttendanceDialog,
    matchMembersByMatchId,
  ]);

  const {
    today: todayMatches,
    upcoming: upcomingMatches,
    past: pastMatches,
  } = useMemo(() => splitMatchSections(matchItems), [matchItems]);

  useTeamHeader({ title, id, isMember, role, onFollow: handleFollow });

  const handleMatchesRefresh = useMemo(
    () => async () => {
      await Promise.all([
        refetchMatches(),
        teamsQuery.refetch(),
        leaguesQuery.refetch(),
        ...matches.map((match) =>
          queryClient.invalidateQueries({
            queryKey: ["match-members-by-team", match.id, id],
          }),
        ),
      ]);
    },
    [refetchMatches, teamsQuery, leaguesQuery, matches, queryClient, id],
  );

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers(
    {
      id,
      currentTab: tab,
      boardPosts,
      onRefresh,
      refetchPosts,
      refetchOverview,
      deletePostMutation,
      entityName: "Team",
      onMatchesRefresh: handleMatchesRefresh,
    },
  );

  const selectedIndex = getTeamTabIndex(tab);

  const tiles = overview?.tiles?.length
    ? overview.tiles
    : [
        { key: "points" as const, label: "Points" },
        { key: "matches" as const, label: "Matches" },
        { key: "streak" as const, label: "Streak" },
        { key: "minutes" as const, label: "Minutes" },
      ];

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={20}
        tabs
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        <Tabs
          values={TeamTabs.map((teamTab) => TeamTabLabels[teamTab])}
          selectedIndex={selectedIndex}
          onValueChange={(value) => {
            const index = TeamTabs.findIndex(
              (teamTab) => TeamTabLabels[teamTab] === value,
            );
            const newTab = index >= 0 ? TeamTabs[index] : "board";
            setTab(newTab);
            log.info("Tab changed", { tab: newTab });
          }}
        />

        {isLoading ? (
          <View style={styles.container}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <>
            {refreshing && !isLoading && (
              <ActivityIndicator size="small" color="#fff" />
            )}

            {tab === "board" && (
              <BoardList
                posts={boardPosts}
                isLoading={postsLoading}
                spaceName={team?.name ?? title}
                spaceLogo={
                  team?.logoUrl
                    ? { uri: team.logoUrl }
                    : getSportLogo(team?.sport)
                }
                onDeletePost={handleDeletePost}
                canDelete={canManage}
              />
            )}
            {tab === "matches" && (
              <MatchListSections
                today={[...todayMatches]}
                upcoming={[...upcomingMatches]}
                past={[...pastMatches]}
                isLoading={
                  matchesLoading ||
                  teamsQuery.isLoading ||
                  leaguesQuery.isLoading
                }
                errorText={matchesError ? "Could not load matches." : null}
                onRetry={handleMatchesRefresh}
                onMatchPress={(match) =>
                  router.push({
                    pathname:
                      `/(sheets)/match/${match.id}` as RelativePathString,
                    params: {
                      context: "team",
                      contextId: id,
                      homeName: match.homeName,
                      awayName: match.awayName,
                      homeLogoUrl: match.homeLogoUrl ?? "",
                      awayLogoUrl: match.awayLogoUrl ?? "",
                    },
                  })
                }
              />
            )}
            {tab === "overview" && (
              <View style={styles.overviewSection}>
                <TeamOverviewTab
                  overviewLoading={overviewLoading}
                  overviewError={overviewError}
                  overview={overview}
                  tiles={tiles}
                />

                {canManage && (
                  <Button
                    type="custom"
                    label="Open Playmaker"
                    onPress={() => router.push(`/playmaker/${id}`)}
                  />
                )}
              </View>
            )}
          </>
        )}
      </ContentArea>

      {canManage && tab === "board" ? (
        <View style={styles.fab}>
          <Button
            type="custom"
            icon="plus"
            onPress={() =>
              router.push({
                pathname: "/post",
                params: {
                  id,
                  spaceType: "team",
                  privacy: team?.privacy,
                },
              })
            }
          />
        </View>
      ) : null}

      {isOwner && tab === "matches" ? (
        <View style={styles.fab}>
          <Button
            type="custom"
            icon="plus"
            onPress={() => router.push(`/teams/${id}/matches/schedule`)}
          />
        </View>
      ) : null}
    </View>
  );
}

function parseTeamTab(value?: string): TeamTab {
  const normalized = value?.toLowerCase() as TeamTab | undefined;
  return TeamTabs.find((teamTab) => teamTab === normalized) ?? "board";
}

function getTeamTabIndex(tab: TeamTab): number {
  return TeamTabs.indexOf(tab);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  overviewSection: {
    marginTop: 12,
    gap: 12,
  },

  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});
