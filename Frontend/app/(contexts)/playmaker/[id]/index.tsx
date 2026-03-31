import {
  useCallback,
  useLayoutEffect,
  useState,
  useEffect,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { PlayMakerArea } from "@/components/play-maker/play-maker-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/header/page-title";
import type { Shape } from "@/components/play-maker/model";

import { useTeamPlays } from "@/hooks/use-team-plays";
import { usePlayDetails } from "@/hooks/use-play-details";

// ── helpers ─────────────────────────────────────────────────────

function fromBackendPayload(items: any[]): Shape[] {
  return items.map((item) => {
    if (item.type === "arrow") {
      return {
        type: "arrow" as const,
        id: item.id,
        from: item.from,
        to: item.to,
      };
    }

    return {
      type: "person" as const,
      id: item.id,
      x: item.x,
      y: item.y,
      size: item.size ?? 32,
      ...(item.associatedPlayerId
        ? { associatedPlayerId: item.associatedPlayerId }
        : {}),
    };
  });
}

// ── header (view mode — no Save button) ─────────────────────────

function PlaymakerHeader({ title }: { title: string }) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} subtitle="Playmaker" />}
    />
  );
}

// ── root ────────────────────────────────────────────────────────

export default function PlayMaker() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  return (
    <TeamDetailProvider id={id}>
      <PlayListContent />
    </TeamDetailProvider>
  );
}

// ── main content (view mode) ────────────────────────────────────

function PlayListContent() {
  const {
    isLoading,
    refreshing,
    onRefresh,
    title,
    id: teamId,
  } = useTeamDetailContext();

  const navigation = useNavigation();
  const router = useRouter();

  // ── play-loading state ──────────────────────────────────────
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [loadedShapes, setLoadedShapes] = useState<Shape[]>([]);

  // ── fetch play IDs ──────────────────────────────────────────
  const {
    data: plays,
    isLoading: playsLoading,
  } = useTeamPlays(teamId);

  // ── fetch selected play's details ───────────────────────────
  const {
    data: playItems,
    isLoading: playItemsLoading,
  } = usePlayDetails(teamId, selectedPlayId);

  // ── convert backend items → shapes when they arrive ─────────
  useEffect(() => {
    if (!playItems) return;
    const shapes = fromBackendPayload(playItems);
    setLoadedShapes(shapes);
  }, [playItems]);

  // ── header (no save button) ─────────────────────────────────
  const headerTitle = useCallback(
    () => <PlaymakerHeader title={title} />,
    [title],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle });
  }, [navigation, headerTitle]);

  // ── handle play selection ───────────────────────────────────
  const handleSelectPlay = (playId: string) => {
    if (selectedPlayId === playId) {
      setSelectedPlayId(null);
      setLoadedShapes([]);
    } else {
      setSelectedPlayId(playId);
    }
  };

  return (
    <ContentArea
      paddingBottom={100}
      backgroundProps={{ preset: "red" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* ── Play list ──────────────────────────────────────── */}
        {playsLoading ? (
          <ActivityIndicator
            color="white"
            style={{ marginVertical: 16 }}
          />
        ) : plays && plays.length > 0 ? (
          <View style={playStyles.list}>
            {plays.map((id, index) => {
              const isSelected = selectedPlayId === id;

              return (
                <View key={id}>
                  {/* ── Play row using Card ─────────────────── */}
                  <Pressable onPress={() => handleSelectPlay(id)}>
                    <Card isInteractive>
                      <View style={playStyles.cardRow}>
                        <Text style={playStyles.cardTitle}>
                          Play {index + 1}
                        </Text>

                        {isSelected && playItemsLoading ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text style={playStyles.chevron}>
                            {isSelected ? "✓" : ">"}
                          </Text>
                        )}
                      </View>
                    </Card>
                  </Pressable>

                  {/* ── Expanded board (view only) ──────────── */}
                  {isSelected && (
                    <View style={playStyles.boardContainer}>
                      <PlayMakerArea
                        key={selectedPlayId}
                        styles={boardStyles}
                        initialShapes={loadedShapes}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={playStyles.emptyContainer}>
            <Text style={playStyles.emptyText}>
              No saved plays yet
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Create Play button (fixed at bottom) ─────────────── */}
      <View style={playStyles.bottomBar}>
        <Button
          type="custom"
          isInteractive
          label="Create Play"
          onPress={() =>
            router.push(`/(contexts)/playmaker/${teamId}/create`)
          }
        />
      </View>

      {isLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
    </ContentArea>
  );
}

// ── board styles for expanded view ──────────────────────────────

const boardStyles = StyleSheet.create({
  container: { flex: 1 },
  boardWrapper: { height: 300 },
  shapeArea: {
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  panelArea: { height: 200 },
});

// ── play list styles ────────────────────────────────────────────

const playStyles = StyleSheet.create({
  list: {
    gap: 10,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  chevron: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    opacity: 0.6,
  },

  boardContainer: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.2)",
    overflow: "hidden",
    minHeight: 560,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "white",
    opacity: 0.4,
    fontSize: 16,
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
});
