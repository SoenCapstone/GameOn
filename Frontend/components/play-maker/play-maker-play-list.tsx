import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { RelativePathString, useRouter } from "expo-router";
import { usePlayDetails } from "@/hooks/use-play-details";
import type { ApiPlayShape, Shape } from "@/types/playmaker";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { DefaultBoard } from "@/components/play-maker/play-maker-default-board";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import { Loading } from "@/components/ui/loading";
import { fromBackendPayload } from "@/utils/playmaker";

type PlayMakerPlayListProps = Readonly<{
  teamId: string;
  plays: string[];
}>;

export function PlayMakerPlayList({ teamId, plays }: PlayMakerPlayListProps) {
  const router = useRouter();
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(null);
  const [loadedShapes, setLoadedShapes] = useState<Shape[]>([]);

  const { data: playItems, isLoading: playItemsLoading } = usePlayDetails(
    teamId,
    selectedPlayId,
  );

  useEffect(() => {
    if (!Array.isArray(playItems)) {
      return;
    }

    setLoadedShapes(fromBackendPayload(playItems as ApiPlayShape[]));
  }, [playItems]);

  const renderedShapes = useRenderPlayMakerShapes(
    loadedShapes,
    null,
    () => null,
    () => {},
  );

  const handleSelectPlay = useCallback((playId: string) => {
    setSelectedPlayId((prev) => {
      if (prev === playId) {
        setLoadedShapes([]);
        return null;
      }
      return playId;
    });
  }, []);

  if (plays.length === 0) {
    return <Empty message="No saved plays yet" />;
  }

  return (
    <View style={styles.container}>
      {plays.map((playId, index) => {
        const isSelected = selectedPlayId === playId;
        const playName = `Play ${index + 1}`;

        return (
          <View key={playId}>
            <Pressable onPress={() => handleSelectPlay(playId)}>
              <Card isInteractive>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle}>{playName}</Text>
                  {isSelected && playItemsLoading ? (
                    <Loading />
                  ) : (
                    <Text style={styles.chevron}>{isSelected ? "v" : ">"}</Text>
                  )}
                </View>
              </Card>
            </Pressable>

            {isSelected ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname:
                      `/teams/${teamId}/playmaker/create` as RelativePathString,
                    params: { playId, playName },
                  })
                }
              >
                <View style={styles.boardContainer}>
                  <DefaultBoard>{renderedShapes}</DefaultBoard>
                </View>
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    minHeight: 320,
    height: 320,
  },
});
