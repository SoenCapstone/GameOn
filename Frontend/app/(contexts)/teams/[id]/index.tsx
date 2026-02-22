import { useState, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Text,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Button } from "@/components/ui/button";
import { getSportLogo } from "@/components/browse/utils";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useTeamHeader } from "@/hooks/use-team-league-header";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { useTeamBoardPosts, useDeleteBoardPost } from "@/hooks/use-team-board";
import { BoardList } from "@/components/board/board-list";
import { errorToString } from "@/utils/error";
import { createScopedLog } from "@/utils/logger";
import { Card } from "@/components/ui/card";

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
  const [tab, setTab] = useState<"board" | "overview" | "games">("board");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
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
  const log = createScopedLog("Team Page");

  const {
    data: boardPosts = [],
    isLoading: postsLoading,
    refetch: refetchPosts,
  } = useTeamBoardPosts(id);

  const deletePostMutation = useDeleteBoardPost(id);

  useTeamHeader({ title, id, isMember, onFollow: handleFollow });

  const getTabFromSegmentValue = (
    value: string,
  ): "board" | "overview" | "games" => {
    if (value === "Board") return "board";
    if (value === "Overview") return "overview";
    return "games";
  };

  const getSelectedIndex = (): number => {
    if (tab === "board") return 0;
    if (tab === "overview") return 1;
    return 2;
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        onPress: () => log.info("Delete post cancelled", { postId }),
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deletePostMutation.mutateAsync(postId);
            log.info("Post deleted", { postId });
          } catch (err) {
            log.error("Failed to delete post", {
              postId,
              error: errorToString(err),
            });
            Alert.alert("Failed to delete", errorToString(err));
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await onRefresh();
      if (tab === "board") {
        await refetchPosts();
        log.info("Board posts refreshed", { postCount: boardPosts.length });
      } else {
        log.info("Team data refreshed", { tab });
      }
    } catch (err) {
      log.error("Refresh failed", { error: errorToString(err), tab });
    } finally {
      setRefreshing(false);
    }
  }, [log, onRefresh, refetchPosts, tab, boardPosts.length]);

  return (
    <View style={{ flex: 1 }}>
      <ContentArea
        scrollable
        paddingBottom={20}
        segmentedControl
        backgroundProps={{ preset: "red" }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
      >
        <SegmentedControl
          values={["Board", "Overview", "Games"]}
          selectedIndex={getSelectedIndex()}
          onValueChange={(value) => {
            const newTab = getTabFromSegmentValue(value);
            setTab(newTab);
            log.info("Tab changed", { tab: newTab });
          }}
          style={{ height: 40 }}
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

            {tab === "overview" && (
              <View style={styles.overviewWrap}>
                {/* Season Card */}
                <Card>
                  <View style={styles.cardFill}>
                    <View style={styles.glassInner}>
                      <View style={styles.seasonHeader}>
                        <Text style={styles.seasonTitle}>Season 2026</Text>
                        <View style={styles.skelRecord} />
                      </View>

                      <View style={styles.tilesGrid}>
                        {["Points", "Matches", "Streak", "Minutes"].map(
                          (label) => (
                            <View key={label} style={styles.statTile}>
                              <View style={styles.statTileBox}>
                                <View style={styles.skelNum} />
                                <Text style={styles.statLabel}>{label}</Text>
                              </View>
                            </View>
                          ),
                        )}
                      </View>
                    </View>
                  </View>
                </Card>

                {/* Roster Card */}
                <Card>
                  <View style={styles.cardFill}>
                    <View style={styles.rosterCard}>
                      <View style={styles.rosterHeader}>
                        <Text style={styles.rosterTitle}>Roster</Text>
                        <View style={styles.rosterTotalWrap}>
                          <Text style={styles.rosterTotalLabel}>Total</Text>
                          <View style={styles.skelRosterTotal} />
                        </View>
                      </View>

                      <View style={styles.rosterDivider} />

                      <View style={styles.rosterList}>
                        <View style={styles.rosterItem}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>Owner</Text>
                          </View>
                          <View style={styles.skelCount} />
                        </View>

                        <View style={styles.rosterItem}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>Manager</Text>
                          </View>
                          <View style={styles.skelCount} />
                        </View>

                        <View style={styles.rosterItem}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>Players</Text>
                          </View>
                          <View style={styles.skelCount} />
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>

                {/* Team Performance (universal + abbreviated labels) */}
                <TeamPerformanceCardPlaceholder />

                {canManage && (
                  <Button
                    type="custom"
                    label="Open Playmaker"
                    onPress={() => router.push(`/playmaker/${id}`)}
                  />
                )}
              </View>
            )}

            {tab === "games" && (
              <Text style={{ color: "white" }}>Games content here</Text>
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

/**
 * UNIVERSAL placeholder: layout only, no sport-specific metric names.
 */
function TeamPerformanceCardPlaceholder() {
  const LABELS = ["OFF", "DEF", "DIS"]; // universal buckets

  return (
    <Card>
      <View style={styles.cardFill}>
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>Team Performance</Text>

          <View style={styles.performanceList}>
            {LABELS.map((label) => (
              <View key={label} style={styles.performanceRow}>
                <Text style={styles.perfLabel}>{label}</Text>

                <View style={styles.perfTrack}>
                  <View style={styles.skelPerfFill} />
                </View>

                <View style={styles.skelPerfValue} />
              </View>
            ))}
          </View>

          {/* Divider (optional but looks nicer) */}
          <View style={styles.rosterDivider} />

          {/* INF footer */}
          <View style={styles.perfFooterRow}>
            <Text style={styles.perfFooterLabel}>INF</Text>
            <View style={styles.skelPerfFooter} />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  overviewWrap: {
    marginTop: 12,
    gap: 12,
  },

  cardFill: {
    margin: -24,
  },

  /* ---------------- Season card ---------------- */

  glassInner: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  seasonHeader: {
    alignItems: "center",
    marginBottom: 4,
  },

  seasonTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  tilesGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },

  statTile: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  statTileBox: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  statLabel: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 6,
    fontSize: 12,
  },

  /* ---------------- Roster card ---------------- */

  rosterCard: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  rosterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rosterTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  rosterTotalWrap: {
    alignItems: "flex-end",
    gap: 6,
  },

  rosterTotalLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },

  rosterDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 12,
    marginBottom: 12,
  },

  rosterList: {
    gap: 10,
  },

  rosterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rolePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  rolePillText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "600",
  },

  /* ---------------- Team Performance ---------------- */

  performanceCard: {
    borderRadius: 26,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  performanceTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },

  performanceList: {
    gap: 12,
  },

  performanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  perfLabel: {
    width: 42,
    marginRight: 10,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  perfTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    marginRight: 10,
  },

  perfFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 2,
  },

  perfFooterLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* ---------------- Actions ---------------- */

  fabWrap: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },

  /* ---------------- Skeleton / Placeholder ---------------- */

  skelNum: {
    height: 22,
    width: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  skelRecord: {
    marginTop: 6,
    height: 12,
    width: 120,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  skelRosterTotal: {
    height: 22,
    width: 44,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  skelCount: {
    height: 14,
    width: 26,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  skelPerfFill: {
    width: "55%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  skelPerfValue: {
    width: 22,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  skelPerfFooter: {
    height: 12,
    width: "60%",
    alignSelf: "center",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
});