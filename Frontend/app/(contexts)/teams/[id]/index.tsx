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
import { Card } from "@/components/ui/card";
import { useTeamOverview } from "@/hooks/use-team-overview";
import { Tabs } from "@/components/ui/tabs";
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
  const initialTab: TeamTab = parseTeamTab(params.tab);
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
      refetchOverview,
      deletePostMutation,
      entityName: "Team",
      onMatchesRefresh: handleMatchesRefresh,
    },
  );

  function parseTeamTab(value?: string): TeamTab {
    const normalized = value?.toLowerCase();
    if (normalized === "matches") return "matches";
    if (normalized === "overview") return "overview";
    return "board";
  }

  const getSelectedIndex = (): number => {
    if (tab === "board") return 0;
    if (tab === "matches") return 1;
    return 2;
  };

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
          values={["Board", "Matches", "Overview"]}
          selectedIndex={getSelectedIndex()}
          onValueChange={(value) => {
            const newTab = parseTeamTab(value);
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
              <View style={styles.overviewWrap}>
                {/* lightweight load/error display for the mocked endpoint */}
                {overviewLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={{ marginTop: 6 }}
                  />
                )}
                {overviewError && (
                  <Text
                    style={{ color: "rgba(255,255,255,0.85)", marginTop: 6 }}
                  >
                    {errorToString(overviewError)}
                  </Text>
                )}

                {/* Season Card */}
                <Card>
                  <View style={styles.cardFill}>
                    <View style={styles.glassInner}>
                      <View style={styles.seasonHeader}>
                        <Text style={styles.seasonTitle}>
                          {overview?.seasonLabel ?? "Season 2026"}
                        </Text>

                        {overview?.record ? (
                          <Text style={styles.recordText}>
                            {overview.record}
                          </Text>
                        ) : (
                          <View style={styles.skelRecord} />
                        )}
                      </View>

                      <View style={styles.tilesGrid}>
                        {tiles.map((tile) => (
                          <View key={tile.key} style={styles.statTile}>
                            <View style={styles.statTileBox}>
                              {tile.value === undefined ? (
                                <View style={styles.skelNum} />
                              ) : (
                                <Text style={styles.statValue}>
                                  {String(tile.value)}
                                </Text>
                              )}

                              <Text style={styles.statLabel}>{tile.label}</Text>
                            </View>
                          </View>
                        ))}
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

                          {overview?.rosterCounts?.total === undefined ? (
                            <View style={styles.skelRosterTotal} />
                          ) : (
                            <Text style={styles.rosterTotalValue}>
                              {String(overview.rosterCounts.total)}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.rosterDivider} />

                      <View style={styles.rosterList}>
                        <View style={styles.rosterItem}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>Owner</Text>
                          </View>

                          {overview?.rosterCounts?.owner === undefined ? (
                            <View style={styles.skelCount} />
                          ) : (
                            <Text style={styles.rosterCountValue}>
                              {String(overview.rosterCounts.owner)}
                            </Text>
                          )}
                        </View>

                        <View style={styles.rosterItem}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>Manager</Text>
                          </View>

                          {overview?.rosterCounts?.manager === undefined ? (
                            <View style={styles.skelCount} />
                          ) : (
                            <Text style={styles.rosterCountValue}>
                              {String(overview.rosterCounts.manager)}
                            </Text>
                          )}
                        </View>

                        <View style={styles.rosterItem}>
                          <View style={styles.rolePill}>
                            <Text style={styles.rolePillText}>Players</Text>
                          </View>

                          {overview?.rosterCounts?.players === undefined ? (
                            <View style={styles.skelCount} />
                          ) : (
                            <Text style={styles.rosterCountValue}>
                              {String(overview.rosterCounts.players)}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>

                <TeamPerformanceCardPlaceholder
                  performance={overview?.performance}
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

/**
 * UNIVERSAL placeholder: layout only, no sport-specific metric names.
 */
function TeamPerformanceCardPlaceholder(props: {
  readonly performance?: {
    readonly off?: number;
    readonly def?: number;
    readonly dis?: number;
    readonly inf?: number;
  };
}) {
  const LABELS: { key: "off" | "def" | "dis"; label: string }[] = [
    { key: "off", label: "OFF" },
    { key: "def", label: "DEF" },
    { key: "dis", label: "DIS" },
  ];

  const perf = props.performance;

  const clampPct = (n: number) => {
    if (Number.isNaN(n)) return 0;
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
  };

  return (
    <Card>
      <View style={styles.cardFill}>
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>Team Performance</Text>

          <View style={styles.performanceList}>
            {LABELS.map(({ key, label }) => {
              const value = perf?.[key];
              const hasValue = value === undefined;
              const pct = hasValue ? 55 : clampPct(Number(value));

              return (
                <View key={label} style={styles.performanceRow}>
                  <Text style={styles.perfLabel}>{label}</Text>

                  <View style={styles.perfTrack}>
                    <View style={[styles.skelPerfFill, { width: `${pct}%` }]} />
                  </View>

                  {hasValue ? (
                    <View style={styles.skelPerfValue} />
                  ) : (
                    <Text style={styles.perfValueText}>{String(value)}</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.rosterDivider} />

          <View style={styles.perfFooterRow}>
            <Text style={styles.perfFooterLabel}>INF</Text>

            {perf?.inf === undefined ? (
              <View style={styles.skelPerfFooter} />
            ) : (
              <Text style={styles.perfFooterValueText}>{String(perf.inf)}</Text>
            )}
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

  recordText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
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

  statValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
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

  rosterTotalValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
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

  rosterCountValue: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "800",
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

  perfValueText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
    minWidth: 22,
    textAlign: "right",
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

  perfFooterValueText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "800",
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
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
});
