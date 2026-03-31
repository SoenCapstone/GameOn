import { useCallback, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LegendList } from "@legendapp/list/react-native";
import { InfoCard } from "@/components/info-card";
import { createScopedLog } from "@/utils/logger";
import { onSearchResultPress } from "@/utils/search";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";
import { teamsTab } from "@/constants/search";
import type {
  SearchValue,
  SearchResult,
  SearchModeConfig,
} from "@/constants/search";

type Props = {
  readonly scope: string;
  readonly search: SearchValue;
  readonly selectedMode?: SearchModeConfig;
  readonly resultFilter?: (result: SearchResult) => boolean;
};

function Separator() {
  return <View style={styles.separator} />;
}

export function SearchResultsScreen({
  scope,
  search,
  selectedMode = teamsTab,
  resultFilter,
}: Props) {
  const log = createScopedLog(scope);
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
  } = search;

  const q = (query || "").toLowerCase().trim();
  const renderT0 = useRef<number | null>(null);
  const renderLogged = useRef(false);

  const now = () =>
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  useEffect(() => {
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

  useEffect(() => {
    renderT0.current = now();
    renderLogged.current = false;
  }, [results]);

  const handlePress = useCallback(
    (result: SearchResult) => {
      log.info("search result pressed", {
        resultId: result.id,
        resultName: result.name,
        resultType: result.type,
      });
      try {
        onSearchResultPress(result);
      } catch (e) {
        log.error("failed to navigate to result", { err: e });
      }
    },
    [log],
  );

  const renderItem = useCallback(
    (props: { item: SearchResult }) => {
      const { item } = props;
      return (
        <InfoCard
          title={item.name}
          subtitle={item.subtitle}
          onPress={() => handlePress(item)}
          image={item.logo}
        />
      );
    },
    [handlePress],
  );

  const displayedResults = useMemo(() => {
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

  const emptyMessage = useMemo(() => {
    if (searchActive) {
      return q ? "No results found" : null;
    }

    return `No ${selectedMode.label.toLowerCase()} available`;
  }, [q, searchActive, selectedMode.label]);

  return (
    <>
      {isLoading ? <Loading /> : null}

      {searchActive && teamError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load teams: {teamError}
          </Text>
        </View>
      ) : null}
      {searchActive && leagueError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load leagues: {leagueError}
          </Text>
        </View>
      ) : null}
      {!searchActive && selectedMode.key === "teams" && teamError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load teams: {teamError}
          </Text>
        </View>
      ) : null}
      {!searchActive && selectedMode.key === "leagues" && leagueError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load leagues: {leagueError}
          </Text>
        </View>
      ) : null}

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
        ListEmptyComponent={
          !isLoading && emptyMessage ? <Empty message={emptyMessage} /> : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  separator: { height: 14 },
  resultsContentStatic: { paddingVertical: 0.1 },
  loadingContainer: { padding: 8 },
  errorContainer: {
    backgroundColor: "#661313",
    padding: 8,
    marginVertical: 6,
    borderRadius: 8,
  },
  errorText: { color: "#fff" },
});
