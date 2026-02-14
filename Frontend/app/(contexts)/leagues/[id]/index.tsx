import React, { useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Card } from "@/components/ui/card";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import { BoardList } from "@/components/board/board-list";
import { getSportLogo } from "@/components/browse/utils";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import { useLeagueHeader } from "@/hooks/use-team-league-header";
import {
  useLeagueBoardPosts,
  useDeleteLeagueBoardPost,
} from "@/hooks/use-league-board";
import { useDetailPageHandlers } from "@/hooks/use-detail-page-handlers";
import { MatchListSections } from "@/components/matches/match-list-sections";
import { matchStyles } from "@/components/matches/match-styles";
import { useLeagueMatches, useTeamsByIds } from "@/hooks/use-matches";
import {
  buildMatchCards,
  splitMatchSections,
} from "@/features/matches/utils";

type LeagueTab = "board" | "matches";

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
  const router = useRouter();
  const [tab, setTab] = useState<LeagueTab>("board");
  const [fabOpen, setFabOpen] = useState(false);

  const { id, isLoading, onRefresh, handleFollow, title, isMember, isOwner, league } =
    useLeagueDetailContext();

  useLeagueHeader({ title, id, isMember, isOwner, onFollow: handleFollow });

  const { data: boardPosts = [], isLoading: postsLoading, refetch: refetchPosts } =
    useLeagueBoardPosts(id);
  const deletePostMutation = useDeleteLeagueBoardPost(id);

  const {
    data: matches = [],
    isLoading: matchesLoading,
    isFetching: matchesFetching,
    error: matchesError,
    refetch: refetchMatches,
  } = useLeagueMatches(id);

  const teamIds = useMemo(
    () => Array.from(new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId]))),
    [matches],
  );
  const teamsQuery = useTeamsByIds(teamIds);

  const matchItems = useMemo(
    () => buildMatchCards(matches, teamsQuery.data, league?.name ?? "League Match"),
    [league?.name, matches, teamsQuery.data],
  );

  const { current, upcoming, past } = useMemo(
    () => splitMatchSections(matchItems),
    [matchItems],
  );

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers({
    id,
    currentTab: tab,
    boardPosts,
    onRefresh,
    refetchPosts,
    deletePostMutation,
    entityName: "League",
  });

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={100}
        segmentedControl
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || matchesFetching}
            onRefresh={async () => {
              await handleRefresh();
              if (tab === "matches") {
                await Promise.all([refetchMatches(), teamsQuery.refetch()]);
              }
            }}
            tintColor="#fff"
          />
        }
      >
        <SegmentedControl
          values={["Board", "Matches"]}
          selectedIndex={tab === "board" ? 0 : 1}
          onValueChange={(value) => setTab(value === "Board" ? "board" : "matches")}
          style={{ height: 40 }}
        />

        {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}

        {tab === "board" ? (
          <BoardList
            posts={boardPosts}
            isLoading={postsLoading}
            spaceName={league?.name ?? title}
            spaceLogo={league?.logoUrl ? { uri: league.logoUrl } : getSportLogo(league?.sport)}
            onDeletePost={handleDeletePost}
            canDelete={isOwner}
          />
        ) : (
          <MatchListSections
            current={current}
            upcoming={upcoming}
            past={past}
            isLoading={matchesLoading || teamsQuery.isLoading}
            errorText={matchesError ? "Could not load matches." : null}
            onRetry={() => {
              refetchMatches();
              teamsQuery.refetch();
            }}
            onMatchPress={(matchId) => router.push(`/leagues/${id}/matches/${matchId}`)}
          />
        )}
      </ContentArea>

      {isOwner ? (
        <View style={matchStyles.fabWrap}>
          {fabOpen ? (
            <Card>
              <View style={matchStyles.fabMenu}>
                <Button
                  type="custom"
                  label="Create a Post"
                  onPress={() => {
                    setFabOpen(false);
                    router.push({
                      pathname: "/post",
                      params: { id, spaceType: "league", privacy: league?.privacy },
                    });
                  }}
                />
                <Button
                  type="custom"
                  label="Schedule a Match"
                  onPress={() => {
                    setFabOpen(false);
                    router.push(`/leagues/${id}/matches/schedule`);
                  }}
                />
              </View>
            </Card>
          ) : null}

          <View style={{ width: 56, height: 56 }}>
            <Button
              type="custom"
              icon={fabOpen ? "xmark" : "plus"}
              onPress={() => setFabOpen((value) => !value)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
