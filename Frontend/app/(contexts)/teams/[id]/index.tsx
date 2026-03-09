import { useMemo, useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
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
import { MatchListSections } from "@/components/matches/match-list-sections";
import {
  useCancelTeamMatch,
  useLeaguesByIds,
  useTeamMatches,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { buildMatchCards, splitMatchSections } from "@/features/matches/utils";
import { errorToString } from "@/utils/error";

type TeamTab = "board" | "matches" | "overview";

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
  const initialTab: TeamTab = resolveTeamTab(params.tab);
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const router = useRouter();
  const log = createScopedLog("Team Page");
  const queryClient = useQueryClient();
  const { userId } = useAuth();

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
    (isActiveMember && role === "OWNER") ||
    role === "COACH" ||
    role === "MANAGER";

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const deletePostMutation = useDeleteBoardPost(id);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useTeamMatches(id);
  const cancelTeamMutation = useCancelTeamMatch();

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
      const canCancel = Boolean(
        !isLeagueMatch &&
          userId &&
          !match.isPast &&
          match.status !== "CANCELLED" &&
          ((homeOwnerId && homeOwnerId === userId) ||
            (awayOwnerId && awayOwnerId === userId)),
      );

      return {
        ...match,
        canCancel,
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
  ]);

  const {
    today: todayMatches,
    upcoming: upcomingMatches,
    past: pastMatches,
  } = useMemo(() => splitMatchSections(matchItems), [matchItems]);

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const handleMatchesRefresh = useMemo(
    () => async () => {
      await Promise.all([
        refetchMatches(),
        teamsQuery.refetch(),
        leaguesQuery.refetch(),
      ]);
    },
    [refetchMatches, teamsQuery, leaguesQuery],
  );

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers(
    {
      id,
      currentTab: tab,
      boardPosts,
      onRefresh,
      refetchPosts,
      deletePostMutation,
      entityName: "Team",
      onMatchesRefresh: handleMatchesRefresh,
    },
  );

  const getTabFromSegmentValue = (value: string): TeamTab => {
    if (value === "Board") return "board";
    if (value === "Overview") return "overview";
    return "matches";
  };

  const getSelectedIndex = (): number => {
    if (tab === "board") return 0;
    if (tab === "matches") return 1;
    return 2;
  };

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        style={{ paddingBottom: 20 }}
        tabs={{
          values: ["Board", "Matches", "Overview"],
          selectedIndex: getSelectedIndex(),
          onValueChange: (value) => {
            const newTab = getTabFromSegmentValue(value);
            setTab(newTab);
            log.info("Tab changed", { tab: newTab });
          },
        }}
        background={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        {isLoading ? (
          <View style={styles.container}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <>
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
              <View>
                <Text style={{ color: "white", padding: 16 }}>
                  Overview content here
                </Text>
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

function resolveTeamTab(tab?: string): TeamTab {
  if (tab === "matches") return "matches";
  if (tab === "overview") return "overview";
  return "board";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});
