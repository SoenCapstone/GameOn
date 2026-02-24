import { useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Tabs } from "@/components/ui/tabs";

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
  const [tab, setTab] = useState<"board" | "matches" | "overview">("board");
  const router = useRouter();
  const log = createScopedLog("Team Page");

  const {
    id,
    isLoading,
    onRefresh,
    handleFollow,
    title,
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

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const { refreshing, handleDeletePost, handleRefresh } = useDetailPageHandlers(
    {
      id,
      currentTab: tab,
      boardPosts,
      onRefresh,
      refetchPosts,
      deletePostMutation,
      entityName: "Team",
    },
  );

  const getTabFromSegmentValue = (
    value: string,
  ): "board" | "matches" | "overview" => {
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
          values={["Board", "Matches", "Overview"]}
          selectedIndex={getSelectedIndex()}
          onValueChange={(value) => {
            const newTab = getTabFromSegmentValue(value);
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
            {refreshing && <ActivityIndicator size="small" color="#fff" />}

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
              <Text style={{ color: "white" }}>Games content here</Text>
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

      {/* Create Post Button */}
      {canManage && tab === "board" && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
          }}
        >
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
});
