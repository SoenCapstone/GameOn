import React, { useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  RefreshControl,
} from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useRouter } from "expo-router";
import { LegendList } from "@legendapp/list";
import { SearchResult } from "@/components/browse/constants";
import SvgImage from "@/components/svg-image";
import { createScopedLog } from "@/utils/logger";
import { useSearch } from "@/contexts/search-context";
import { ContentArea } from "@/components/ui/content-area";
import { InfoCard } from "@/components/info-card";
// import { StyleSheet } from "react-native";
// import { PlayMakerArea } from "@/components/play-maker/play-maker-area";

function Separator() {
  return <View style={styles.separator} />;
}

export default function Spaces() {
  const log = createScopedLog("Spaces Page");
  const router = useRouter();
  const {
    query,
    results,
    markRendered,
    notifyModeChange,
    searchActive,
    isLoading,
    error,
    refetch,
  } = useSearch();
  const q = (query || "").toLowerCase().trim();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);

  const [mode, setMode] = React.useState<"teams" | "leagues" | "tournaments">(
    "teams",
  );
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
    log.info("Page updated");
  }, [refetch, log]);

  // log when mode changes
  React.useEffect(() => {
    const cnt = results.filter((r) =>
      mode === "teams"
        ? r.type === "team"
        : mode === "leagues"
          ? r.type === "league"
          : r.type === "tournament",
    ).length;
    try {
      notifyModeChange(mode, cnt);
    } catch {
      log.info("mode changed (fallback)", { mode, resultCount: cnt });
    }
  }, [mode, notifyModeChange, results, log]);

  const now = () =>
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  // Start timing when results change
  React.useEffect(() => {
    renderT0.current = now();
    renderLogged.current = false;
  }, [results]);

  const handleResultPress = React.useCallback(
    (result: SearchResult) => {
      log.info("search result pressed", {
        resultId: result.id,
        resultName: result.name,
        resultType: result.type,
      });

      try {
        if (result.type === "team") {
          router.push(`../(contexts)/my-teams/${result.id}`);
        }
      } catch (e) {
        log.error("failed to navigate to team/league/tournament", { err: e });
      }
    },
    [log, router],
  );

  const renderItem = React.useCallback(
    (args: { item: SearchResult }) => {
      const { item } = args;
      const isRemoteUrl =
        item.logo.startsWith("http://") || item.logo.startsWith("https://");
      const isFileUri = item.logo.startsWith("file://");
      const isSvg = isRemoteUrl && item.logo.toLowerCase().endsWith(".svg");

      const imageSource: ImageSourcePropType | undefined =
        (isRemoteUrl || isFileUri) && !isSvg ? { uri: item.logo } : undefined;
      let logoElement: React.ReactNode;
      if (isRemoteUrl && isSvg) {
        logoElement = <SvgImage uri={item.logo} width={48} height={48} />;
      } else if (isFileUri || imageSource) {
        // Let InfoCard render image source
        logoElement = null;
      } else {
        logoElement = <Text style={styles.logoText}>{item.logo}</Text>;
      }

      return (
        <InfoCard
          title={item.name}
          subtitle={item.subtitle}
          onPress={() => handleResultPress(item)}
          image={imageSource}
          logo={logoElement}
        />
      );
    },
    [handleResultPress],
  );

  const displayedResults = React.useMemo(() => {
    if (!q && searchActive) return [] as SearchResult[];

    if (searchActive && q) {
      return results.filter((r) => r.name.toLowerCase().includes(q));
    }

    const list = results
      .filter((r) =>
        mode === "teams"
          ? r.type === "team"
          : mode === "leagues"
            ? r.type === "league"
            : r.type === "tournament",
      )
      .filter((r) => r.name.toLowerCase().includes(q));

    return list;
  }, [results, mode, q, searchActive]);

  return (
    <ContentArea
      scrollable
      segmentedControl
      paddingBottom={60}
      backgroundProps={{ preset: "purple" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
      {!q && !searchActive && (
        <SegmentedControl
          values={["Teams", "Leagues", "Tournaments"]}
          selectedIndex={mode === "teams" ? 0 : mode === "leagues" ? 1 : 2}
          onValueChange={(value) => {
            setMode(
              value === "Teams"
                ? "teams"
                : value === "Leagues"
                  ? "leagues"
                  : "tournaments",
            );
          }}
          style={{ height: 40 }}
        />
      )}

      {/* Loading spinner / error banner */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load results: {error}</Text>
        </View>
      ) : null}
      {refreshing && <ActivityIndicator size="small" color="#fff" />}

      {/* Search Results */}
      <LegendList
        data={displayedResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ overflow: "visible" }}
        contentContainerStyle={styles.resultsContentStatic}
        onContentSizeChange={() => {
          if (renderT0.current !== null && !renderLogged.current) {
            const took = Math.max(0, Math.round(now() - renderT0.current));
            try {
              const displayedCount = displayedResults.length;
              markRendered(took, { mode, resultCount: displayedCount, query });
            } catch {
              log.info("render completed (fallback)", {
                query,
                resultCount: results.length,
                tookMs: took,
              });
            }
            renderLogged.current = true;
          }
        }}
        recycleItems={true}
        ItemSeparatorComponent={Separator}
      />

      {/* <PlayMakerArea styles={styles} /> */}
      <></>
    </ContentArea>
  );
}

/* Example of how to use the PlayMakerArea component */

const styles = StyleSheet.create({
  //   container: { flex: 1 },
  //   hint: {
  //     color: "white",
  //     opacity: 0.85,
  //     paddingTop: 10,
  //     paddingBottom: 8,
  //   },
  //   boardWrapper: { height: "50%" },
  //   shapeArea: {
  //     height: "7%",
  //     flexDirection: "row",
  //     justifyContent: "center",
  //     alignItems: "center",
  //   },
  //   panelArea: { height: "34%" },
  logoText: {
    fontSize: 30,
  },
  separator: {
    height: 14,
  },
  resultsContentStatic: {
    paddingVertical: 0.1,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 8,
  },
  errorContainer: {
    backgroundColor: "#661313",
    padding: 8,
    marginVertical: 6,
    borderRadius: 8,
  },
  errorText: {
    color: "#fff",
  },
});
