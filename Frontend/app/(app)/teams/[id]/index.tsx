import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { FollowToolbar } from "@/components/follow/follow-toolbar";
import {
  RelativePathString,
  router,
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { getSportLogo } from "@/utils/search";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useDeleteBoardPost, useTeamBoardPosts } from "@/hooks/use-team-board";
import { BoardList } from "@/components/board/board-list";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { createScopedLog } from "@/utils/logger";
import { useTeamOverview } from "@/hooks/use-team-overview";
import { MatchListSections } from "@/components/matches/match-list-sections";
import {
  useLeaguesByIds,
  useTeamMatches,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { buildMatchCards, splitMatchSections } from "@/utils/matches";
import { TeamOverviewTab } from "@/components/teams/team-overview-tab";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { toast } from "@/utils/toast";
import { usePostHogFlags } from "@/hooks/use-posthog-flags";

type TeamTab = "board" | "matches" | "overview";

const TeamTabs: readonly TeamTab[] = ["board", "matches", "overview"] as const;

const TeamTabLabels: Record<TeamTab, string> = {
  board: "Board",
  matches: "Matches",
  overview: "Overview",
};

function TeamToolbar({
  title,
  id,
  canManageSettings,
  canFollow,
  followLoading,
  isFollowing,
  onFollow,
  onUnfollow,
  openPost,
  openSchedule,
  openPlaymaker,
}: Readonly<{
  title: string;
  id: string;
  canManageSettings: boolean;
  canFollow: boolean;
  followLoading: boolean;
  isFollowing: boolean;
  onFollow: () => void | Promise<void>;
  onUnfollow: () => void | Promise<void>;
  openPost?: () => void;
  openSchedule?: () => void;
  openPlaymaker?: () => void;
}>) {
  const showBottomToolbar = Boolean(openPost || openSchedule || openPlaymaker);

  return (
    <>
      <Stack.Screen.Title>{title}</Stack.Screen.Title>
      {canManageSettings ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="gear"
            onPress={() => router.push(`/teams/${id}/settings`)}
          />
        </Stack.Toolbar>
      ) : canFollow ? (
        <FollowToolbar
          followLoading={followLoading}
          isFollowing={isFollowing}
          onFollow={onFollow}
          onUnfollow={onUnfollow}
        />
      ) : null}
      {showBottomToolbar ? (
        <Stack.Toolbar placement="bottom">
          {openPlaymaker ? (
            <Stack.Toolbar.Button icon="sportscourt" onPress={openPlaymaker} />
          ) : null}
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

function resolveOwnerAction(
  flag: boolean,
  isOwnerCheck: boolean,
  handler: () => void,
) {
  return isOwnerCheck && flag ? handler : undefined;
}

function TeamContent() {
  const params = useLocalSearchParams<{
    tab?: string;
  }>();
  const initialTab: TeamTab = parseTeamTab(params.tab);
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const router = useRouter();
  const log = createScopedLog("Team Page");

  const {
    id,
    isLoading,
    onRefresh,
    canFollow,
    isFollowing,
    isFollowToolbarLoading,
    onFollow,
    onUnfollow,
    title,
    isOwner,
    isActiveMember,
    role,
    team,
  } = useTeamDetailContext();
  const canManage =
    isActiveMember &&
    (role === "OWNER" || role === "COACH" || role === "MANAGER");

  const { canCreatePost, canScheduleMatch } = usePostHogFlags();

  const openPost = useCallback(() => {
    router.push({
      pathname: "/post",
      params: {
        id,
        spaceType: "team",
        privacy: team?.privacy,
      },
    });
  }, [router, id, team?.privacy]);

  const openSchedule = useCallback(() => {
    router.push(`/teams/${id}/matches/schedule`);
  }, [router, id]);

  const openPlaymaker = useCallback(() => {
    router.push(`/teams/${id}/playmaker`);
  }, [router, id]);

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
    return buildMatchCards(matches, teamsQuery.data, (match) => {
      if ("leagueId" in match && match.leagueId) {
        return leaguesQuery.data?.[match.leagueId]?.name ?? "League Match";
      }
      return "Team Match";
    });
  }, [matches, teamsQuery.data, leaguesQuery.data]);

  const {
    today: todayMatches,
    upcoming: upcomingMatches,
    past: pastMatches,
  } = useMemo(() => splitMatchSections(matchItems), [matchItems]);

  useEffect(() => {
    if (!matchesError) return;
    toast.error("Could Not Load Matches", {
      id: `team-matches-error-${id}`,
      description: "Could not load matches.",
    });
  }, [id, matchesError]);

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
        tabs={{
          values: TeamTabs.map((teamTab) => TeamTabLabels[teamTab]),
          selectedIndex,
          onValueChange: (value) => {
            const index = TeamTabs.findIndex(
              (teamTab) => TeamTabLabels[teamTab] === value,
            );
            const newTab = index >= 0 ? TeamTabs[index] : "board";
            setTab(newTab);
            log.info("Tab changed", { tab: newTab });
          },
        }}
        toolbar={
          <TeamToolbar
            title={title}
            id={id}
            canManageSettings={isOwner || role === "MANAGER"}
            canFollow={canFollow}
            followLoading={isFollowToolbarLoading}
            isFollowing={isFollowing}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            openPost={resolveOwnerAction(canCreatePost, canManage, openPost)}
            openSchedule={resolveOwnerAction(
              canScheduleMatch,
              isOwner,
              openSchedule,
            )}
            openPlaymaker={canManage ? openPlaymaker : undefined}
          />
        }
        background={{ preset: "red" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading ? (
          <Loading />
        ) : !team ? (
          <Empty message="Team not found" />
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
                onMatchPress={(match) =>
                  router.push({
                    pathname: `/match/${match.id}` as RelativePathString,
                    params: {
                      space: "team",
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
            {tab === "overview" && (
              <TeamOverviewTab
                overviewLoading={overviewLoading}
                overviewError={overviewError}
                overview={overview}
                tiles={tiles}
              />
            )}
          </>
        )}
      </ContentArea>
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
