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
import { LegendList } from "@legendapp/list";
import { ContentArea } from "@/components/ui/content-area";
import { InfoCard } from "@/components/info-card";
import SvgImage from "@/components/svg-image";
import { createScopedLog } from "@/utils/logger";
import { useSearch } from "@/contexts/search-context";
import type {
  SearchResult,
  Modes,
  SearchModeConfig,
} from "@/components/browse/constants";

type Props = {
  readonly logScope: string;
  readonly backgroundPreset:
    | "blue"
    | "purple"
    | "green"
    | "orange"
    | "red"
    | "salmon"
    | undefined;
  readonly modes: SearchModeConfig[];
  readonly onResultPress: (result: SearchResult) => void;
  readonly resultFilter?: (result: SearchResult) => boolean;
};

function Separator() {
  return <View style={styles.separator} />;
}

export function SearchResultsScreen({
  logScope,
  backgroundPreset,
  modes,
  onResultPress,
  resultFilter,
}: Props) {
  const log = createScopedLog(logScope);
  const {
    query,
    results,
    markRendered,
    notifyModeChange,
    setActiveMode,
    searchActive,
    isLoading,
    teamError,
    leagueError,
    refetch,
  } = useSearch();

  const q = (query || "").toLowerCase().trim();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);
  const [mode, setMode] = React.useState<Modes>(modes[0]?.key ?? "teams");
  const [refreshing, setRefreshing] = React.useState(false);

  const selectedMode = modes.find((m) => m.key === mode) ?? modes[0];

  const now = () =>
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  const handleRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
    log.info("Page updated");
  }, [refetch, log]);

  React.useEffect(() => {
    if (!selectedMode) return;
    const cnt = results.filter((r) => r.type === selectedMode.type).length;
    setActiveMode(selectedMode.key);
    try {
      notifyModeChange(selectedMode.key, cnt);
    } catch {
      log.info("mode changed (fallback)", {
        mode: selectedMode.key,
        resultCount: cnt,
      });
    }
  }, [selectedMode, notifyModeChange, results, log, setActiveMode]);

  React.useEffect(() => {
    renderT0.current = now();
    renderLogged.current = false;
  }, [results]);

  const handlePress = React.useCallback(
    (result: SearchResult) => {
      log.info("search result pressed", {
        resultId: result.id,
        resultName: result.name,
        resultType: result.type,
      });
      try {
        onResultPress(result);
      } catch (e) {
        log.error("failed to navigate to result", { err: e });
      }
    },
    [log, onResultPress],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: SearchResult }) => {
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
        logoElement = null;
      } else {
        logoElement = <Text style={styles.logoText}>{item.logo}</Text>;
      }

      return (
        <InfoCard
          title={item.name}
          subtitle={item.subtitle}
          onPress={() => handlePress(item)}
          image={imageSource}
          logo={logoElement}
        />
      );
    },
    [handlePress],
  );

  const displayedResults = React.useMemo(() => {
    if (!selectedMode) return [] as SearchResult[];

    if (!q && searchActive) return [];
    let base =
      searchActive && q
        ? results
        : results.filter((r) => r.type === selectedMode.type);
    
    if (resultFilter) {
      base = base.filter(resultFilter);
    }
    
    return base.filter((r) => r.name.toLowerCase().includes(q));
  }, [results, selectedMode, q, searchActive, resultFilter]);

  if (!selectedMode) return null;

  const showSegmentedControl = !q && !searchActive;

  return (
    <ContentArea
      scrollable
      segmentedControl={showSegmentedControl}
      paddingBottom={60}
      backgroundProps={
        backgroundPreset ? { preset: backgroundPreset } : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#fff"
        />
      }
    >
      {showSegmentedControl && (
        <SegmentedControl
          values={modes.map((m) => m.label)}
          selectedIndex={modes.findIndex((m) => m.key === selectedMode.key)}
          onValueChange={(value) => {
            const next = modes.find((m) => m.label === value);
            if (next) setMode(next.key);
          }}
          style={{ height: 40 }}
        />
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
      {selectedMode.key === "teams" && teamError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load teams: {teamError}</Text>
        </View>
      ) : null}
      {selectedMode.key === "leagues" && leagueError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load leagues: {leagueError}</Text>
        </View>
      ) : null}
      {refreshing && <ActivityIndicator size="small" color="#fff" />}

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
              markRendered(took, {
                mode: selectedMode.key,
                resultCount: displayedCount,
                query,
              });
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
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  logoText: { fontSize: 30 },
  separator: { height: 14 },
  resultsContentStatic: { paddingVertical: 0.1 },
  loadingContainer: { alignItems: "center", padding: 8 },
  errorContainer: {
    backgroundColor: "#661313",
    padding: 8,
    marginVertical: 6,
    borderRadius: 8,
  },
  errorText: { color: "#fff" },
});
