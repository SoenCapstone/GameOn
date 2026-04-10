import { useCallback, useMemo, useState } from "react";
import { View, RefreshControl } from "react-native";
import {
  RelativePathString,
  router,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { getSportLogo } from "@/utils/search";
import { LeagueBrowserTeams } from "@/components/leagues/league-browser-teams";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import {
  useLeagueBoardPosts,
  useDeleteLeagueBoardPost,
} from "@/hooks/use-league-board";
import { BoardList } from "@/components/board/board-list";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { createScopedLog } from "@/utils/logger";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { useLeagueMatches, useTeamsByIds } from "@/hooks/use-matches";
import { buildMatchCards, splitMatchSections } from "@/utils/matches";
import { useLeagueStandings } from "@/hooks/use-league-standings";
import { LeagueStandings } from "@/components/leagues/league-standings";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

type LeagueTab = "board" | "matches" | "standings" | "teams";

const LeagueTabs: readonly LeagueTab[] = [
  "board",
  "matches",
  "standings",
  "teams",
] as const;

const TabLabels: Record<LeagueTab, string> = {
  board: "Board",
  matches: "Matches",
  standings: "Standings",
  teams: "Teams",
};

function LeagueToolbar({
  title,
  id,
  isMember,
  isOwner,
  onFollow,
  openPost,
  openSchedule,
}: Readonly<{
  title: string;
  id: string;
  isMember: boolean;
  isOwner: boolean;
  onFollow: () => void;
  openPost?: () => void;
  openSchedule?: () => void;
}>) {
  const showBottomToolbar = Boolean(openPost || openSchedule);

  return (
    <>
      <Stack.Screen.Title>{title}</Stack.Screen.Title>
      {isMember || isOwner ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="gear"
            onPress={() => router.push(`/leagues/${id}/settings`)}
          />
        </Stack.Toolbar>
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button onPress={onFollow}>Follow</Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      {showBottomToolbar ? (
        <Stack.Toolbar placement="bottom">
          <Stack.Toolbar.Spacer />
          <Stack.Toolbar.Menu icon="plus">
            {openPost ? (
              <Stack.Toolbar.MenuAction
                icon="square.and.pencil"
                onPress={openPost}
              >
                Create a Post
              </Stack.Toolbar.MenuAction>
            ) : null}
            {openSchedule ? (
              <Stack.Toolbar.MenuAction
                icon="calendar.badge.plus"
                onPress={openSchedule}
              >
                Schedule a Match
              </Stack.Toolbar.MenuAction>
            ) : null}
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      ) : null}
    </>
  );
}

export default function LeagueScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <LeagueDetailProvider id={id}>
      <LeagueContent />
    </LeagueDetailProvider>
  );
}

function LeagueContent() {
  const params = useLocalSearchParams<{
    tab?: string;
    postId?: string | string[];
  }>();
  const initialTab: LeagueTab = resolveLeagueTab(params.tab);
  const targetPostId = Array.isArray(params.postId)
    ? params.postId[0]
    : params.postId;
  const [tab, setTab] = useState<LeagueTab>(initialTab);
  const router = useRouter();
  const log = createScopedLog("League Page");
  const {
    id,
    isLoading,
    onRefresh,
    handleFollow,
    title,
    isMember,
    isOwner,
    league,
    leagueTeams,
    isLeagueTeamsLoading,
    leagueTeamsError,
  } = useLeagueDetailContext();
  const {
    data: standings = [],
    isLoading: standingsLoading,
    error: standingsError,
    refetch: refetchStandings,
  } = useLeagueStandings(id);

  const openPost = useCallback(() => {
    router.push({
      pathname: "/post",
      params: {
        id,
        spaceType: "league",
        privacy: league?.privacy,
      },
    });
  }, [router, id, league?.privacy]);

  const openSchedule = useCallback(() => {
    router.push(`/leagues/${id}/matches/schedule`);
  }, [router, id]);

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useLeagueBoardPosts(id);

  const deletePostMutation = useDeleteLeagueBoardPost(id);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches,
  } = useLeagueMatches(id);

  const teamIds = useMemo(
    () =>
      Array.from(new Set(matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]))),
    [matches],
  );

  const teamsQuery = useTeamsByIds(teamIds);
  const leagueTeamIds = useMemo(
    () =>
      Array.from(
        new Set((leagueTeams ?? []).map((team) => team.teamId)),
      ).filter(Boolean),
    [leagueTeams],
  );
  const leagueTeamsQuery = useTeamsByIds(leagueTeamIds);

  const matchItems = useMemo(() => {
    return buildMatchCards(
      matches,
      teamsQuery.data,
      league?.name ?? "League Match",
    );
  }, [matches, teamsQuery.data, league?.name]);

  const { today, upcoming, past } = useMemo(
    () => splitMatchSections(matchItems),
    [matchItems],
  );

  const handleMatchesRefresh = useMemo(
    () => async () => {
      await Promise.all([refetchMatches(), teamsQuery.refetch()]);
    },
    [refetchMatches, teamsQuery],
  );

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers(
    {
      id,
      currentTab: tab,
      boardPosts,
      onRefresh,
      refetchPosts,
      refetchStandings,
      deletePostMutation,
      entityName: "League",
      onMatchesRefresh: handleMatchesRefresh,
    },
  );

  const selectedIndex = useMemo(() => LeagueTabs.indexOf(tab), [tab]);

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        tabs={{
          values: LeagueTabs.map((t) => TabLabels[t]),
          selectedIndex,
          onValueChange: (value) => {
            const index = LeagueTabs.findIndex((t) => TabLabels[t] === value);
            const nextTab = index >= 0 ? LeagueTabs[index] : "board";
            setTab(nextTab);
            log.info("Tab changed", { tab: nextTab });
          },
        }}
        toolbar={
          <LeagueToolbar
            title={title}
            id={id}
            isMember={isMember}
            isOwner={isOwner}
            onFollow={handleFollow}
            openPost={isOwner ? openPost : undefined}
            openSchedule={isOwner ? openSchedule : undefined}
          />
        }
        background={{ preset: "red" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <Loading />
        ) : !league ? (
          <Empty message="League not found" />
        ) : (
          <>
            {tab === "board" && (
              <BoardList
                posts={boardPosts}
                isLoading={postsLoading}
                spaceName={league?.name ?? title}
                spaceLogo={
                  league?.logoUrl
                    ? { uri: league.logoUrl }
                    : getSportLogo(league?.sport)
                }
                onDeletePost={handleDeletePost}
                canDelete={isOwner}
                targetPostId={targetPostId}
              />
            )}

            {tab === "matches" && (
              <MatchListSections
                today={today}
                upcoming={upcoming}
                past={past}
                isLoading={matchesLoading || teamsQuery.isLoading}
                errorText={matchesError ? "Could not load matches." : null}
                onRetry={handleMatchesRefresh}
                onMatchPress={(match) =>
                  router.push({
                    pathname: `/match/${match.id}` as RelativePathString,
                    params: {
                      space: "league",
                      spaceId: id,
                      homeName: match.homeName,
                      awayName: match.awayName,
                      homeLogoUrl: match.homeLogoUrl ?? "",
                      awayLogoUrl: match.awayLogoUrl ?? "",
                    },
                  })
                }
              />
            )}
            {tab === "standings" && (
              <LeagueStandings
                sport={league?.sport}
                standings={standings}
                isLoading={standingsLoading}
                error={standingsError ? "Could not load standings." : null}
              />
            )}
            {tab === "teams" && (
              <LeagueBrowserTeams
                leagueTeams={leagueTeams ?? []}
                teamsFetching={Boolean(isLeagueTeamsLoading)}
                leagueTeamsError={leagueTeamsError}
                teamDetailsMap={leagueTeamsQuery.data}
                detailsFetching={leagueTeamsQuery.isLoading}
                detailsError={leagueTeamsQuery.error}
              />
            )}
          </>
        )}
      </ContentArea>
    </View>
  );
}

function resolveLeagueTab(tab?: string): LeagueTab {
  if (tab === "matches") return "matches";
  if (tab === "standings") return "standings";
  if (tab === "teams") return "teams";
  return "board";
}
