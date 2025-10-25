import React, { useRef } from "react";
import { Pressable, View, Text, Image, ActivityIndicator } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GlassView } from "expo-glass-effect";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { LegendList } from "@legendapp/list";
import { searchStyles, SearchResult } from "@/components/browse/constants";
import SvgImage from "@/components/svg-image";
import { createScopedLog } from "@/utils/logger";
import { useSearch } from "@/contexts/SearchContext";
import { Background } from "@/components/background";
import { ContentArea } from "@/components/content-area";

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

      return (
        <Pressable
          onPress={() => handleResultPress(item)}
          style={searchStyles.pressableWrapper}
        >
          <GlassView
            isInteractive={true}
            glassEffectStyle="clear"
            style={searchStyles.resultCard}
          >
            <View style={searchStyles.resultRow}>
              <View style={searchStyles.logoContainer}>
                {(() => {
                  let logoElement: React.ReactNode;
                  if (isUrl) {
                    if (isSvg) {
                      logoElement = (
                        <SvgImage uri={item.logo} width={48} height={48} />
                      );
                    } else {
                      logoElement = (
                        <Image
                          source={{ uri: item.logo }}
                          style={searchStyles.logoImage}
                          resizeMode="contain"
                        />
                      );
                    }
                  } else {
                    logoElement = (
                      <Text style={searchStyles.logoText}>{item.logo}</Text>
                    );
                  }
                  return logoElement;
                })()}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={searchStyles.nameText}>{item.name}</Text>
                <Text style={searchStyles.subtitleText}>{item.subtitle}</Text>
              </View>
              <View style={searchStyles.rightIconContainer}>
                <IconSymbol name="chevron.right" size={16} color="#FFFFFF60" />
              </View>
            </View>
          </GlassView>
        </Pressable>
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
        <View style={{ alignItems: "center", padding: 8 }}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      ) : null}
      {error ? (
        <View
          style={{
            backgroundColor: "#661313",
            padding: 8,
            marginVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff" }}>Failed to load teams: {error}</Text>
        </View>
      ) : null}

      {/* Search Results */}
      <LegendList
        data={displayedResults}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          ...searchStyles.resultsContentStatic,
        }}
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
      />
    </ContentArea>
  );
}
