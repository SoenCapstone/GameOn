import React from "react";
import { useRouter } from "expo-router";
import { SearchResultsScreen } from "@/components/browse/search-results-screen";
import { SearchResult } from "@/components/browse/constants";

export default function Browse() {
  const router = useRouter();

  const handleResultPress = React.useCallback(
    (result: SearchResult) => {
      if (result.type === "team") {
        router.push(`/teams/${result.id}`);
      }
    },
    [router],
  );

  return (
    <SearchResultsScreen
      logScope="Browse Page"
      backgroundPreset="blue"
      modes={[
        { key: "teams", label: "Teams", type: "team" },
        { key: "leagues", label: "Leagues", type: "league" },
      ]}
      onResultPress={handleResultPress}
    />
  );
}
