import React, { useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
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

function Separator() {
  return <View style={searchStyles.separator} />;
}

export default function Browse() {
  const log = createScopedLog("Search");
  const router = useRouter();
  const {
    query,
    results,
    markRendered,
    notifyModeChange,
    searchActive,
    isLoading,
    error,
  } = useSearch();
  const q = (query || "").toLowerCase().trim();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);

  const uiLog = createScopedLog("Browse.ui");
  const [mode, setMode] = React.useState<"teams" | "leagues">("teams");

  // log when mode changes
  React.useEffect(() => {
    const cnt = results.filter((r) =>
      mode === "teams" ? r.type === "team" : r.type === "league",
    ).length;
    try {
      notifyModeChange(mode, cnt);
    } catch {
      uiLog.info("mode changed (fallback)", { mode, resultCount: cnt });
    }
  }, [mode, notifyModeChange, results, uiLog]);

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
          router.push(`/teams/${result.id}`);
        }
      } catch (e) {
        log.error("failed to navigate to team/league", { err: e });
      }
    },
    [log, router],
  );

  const renderItem = React.useCallback(
    (args: { item: SearchResult }) => {
      const { item } = args;
      const isUrl =
        item.logo.startsWith("http://") || item.logo.startsWith("https://");
      const isSvg = isUrl && item.logo.toLowerCase().endsWith(".svg");

      const imageSource: ImageSourcePropType | undefined =
        isUrl && !isSvg ? { uri: item.logo } : undefined;
      let logoElement: React.ReactNode;
      if (isUrl) {
        if (isSvg) {
          logoElement = <SvgImage uri={item.logo} width={48} height={48} />;
        } else {
          logoElement = null;
        }
      } else {
        logoElement = <Text style={searchStyles.logoText}>{item.logo}</Text>;
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
        mode === "teams" ? r.type === "team" : r.type === "league",
      )
      .filter((r) => r.name.toLowerCase().includes(q));

    return list;
  }, [results, mode, q, searchActive]);

  return (
    <ContentArea
      scrollable
      segmentedControl
      paddingBottom={60}
      backgroundProps={{ preset: "blue" }}
    >
      {!q && !searchActive && (
        <SegmentedControl
          values={["Teams", "Leagues"]}
          selectedIndex={mode === "teams" ? 0 : 1}
          onValueChange={(value) => {
            setMode(value === "Teams" ? "teams" : "leagues");
          }}
          style={{ height: 40 }}
        />
      )}

      {/* Loading spinner / error banner */}
      {isLoading ? (
        <View style={searchStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
      {error ? (
        <View style={searchStyles.errorContainer}>
          <Text style={searchStyles.errorText}>
            Failed to load teams: {error}
          </Text>
        </View>
      ) : null}

      {/* Search Results */}
      <LegendList
        data={displayedResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ overflow: "visible" }}
        contentContainerStyle={searchStyles.resultsContentStatic}
        onContentSizeChange={() => {
          if (renderT0.current !== null && !renderLogged.current) {
            const took = Math.max(0, Math.round(now() - renderT0.current));
            try {
              const displayedCount = displayedResults.length;
              markRendered(took, { mode, resultCount: displayedCount, query });
            } catch {
              uiLog.info("render completed (fallback)", {
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
    </ContentArea>
  );
}

const searchStyles = StyleSheet.create({
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
