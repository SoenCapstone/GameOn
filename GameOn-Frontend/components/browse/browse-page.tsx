import React, { useRef } from "react";
import { View, Text, ActivityIndicator, ImageSourcePropType } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { LegendList } from "@legendapp/list";
import { searchStyles, SearchResult } from "@/components/browse/constants";
import SvgImage from "@/components/svg-image";
import { createScopedLog } from "@/utils/logger";
import { useSearch } from "@/contexts/SearchContext";
import { Background } from "@/components/ui/background";
import { ContentArea } from "@/components/ui/content-area";
import { InfoCard } from "@/components/info-card";

export function BrowsePage() {
  const log = createScopedLog("Search");
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

  const Separator = () => (
  <View style={searchStyles.separator} />
);

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

  // prefer high-resolution timer when available
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

      // Navigate to team or league page
    },
    [log],
  );

  const renderItem = React.useCallback(
    (args: { item: SearchResult }) => {
      const { item } = args;
      // Check if logo is a URL or emoji/text
      const isUrl =
        item.logo.startsWith("http://") || item.logo.startsWith("https://");
      const isSvg = isUrl && item.logo.toLowerCase().endsWith(".svg");

      const imageSource: ImageSourcePropType | undefined =
        isUrl && !isSvg ? { uri: item.logo } : undefined;

      return (
        <InfoCard
          title={item.name}
          subtitle={item.subtitle}
          onPress={() => handleResultPress(item)}
          image={imageSource}
          logo={
            isUrl ? (
              isSvg ? (
                <SvgImage uri={item.logo} width={48} height={48} />
              ) : null
            ) : (
              <Text style={searchStyles.logoText}>{item.logo}</Text>
            )
          }
        />
      );
    },
    [handleResultPress],
  );

  const displayedResults = React.useMemo(() => {
    if (!q && searchActive) return [] as SearchResult[];

    const list = results
      .filter((r) =>
        mode === "teams" ? r.type === "team" : r.type === "league",
      )
      .filter((r) => {
        if (mode === "teams") return r.name.toLowerCase().includes(q);
        return r.name.toLowerCase().includes(q);
      });

    return list;
  }, [results, mode, q, searchActive]);

  return (
    <ContentArea>
      <Background preset="blue" mode="default" />

      <SegmentedControl
        values={["Teams", "Leagues"]}
        selectedIndex={mode === "teams" ? 0 : 1}
        onValueChange={(value) => {
          setMode(value === "Teams" ? "teams" : "leagues");
        }}
      />

      {/* Loading spinner / error banner */}
      {isLoading ? (
        <View style={searchStyles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
      {error ? (
        <View style={searchStyles.errorContainer}>
          <Text style={searchStyles.errorText}>Failed to load teams: {error}</Text>
        </View>
      ) : null}

      {/* Search Results */}
      <LegendList
        data={displayedResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
