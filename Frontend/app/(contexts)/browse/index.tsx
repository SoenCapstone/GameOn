import React from "react";
import { useRouter } from "expo-router";
import { SearchResultsScreen } from "@/components/browse/search-results-screen";
import { SearchResult, BROWSE_MODES } from "@/components/browse/constants";

export default function Browse() {
  const router = useRouter();

  const handleResultPress = React.useCallback(
    (result: SearchResult) => {
      if (result.type === "team") {
        router.push(`/teams/${result.id}`);
      } else if (result.type === "league") {
        router.push(`/leagues/${result.id}`);
      }
    },
    [router],
  );

  const filterPublicOnly = React.useCallback((result: SearchResult) => {
    return result.privacy?.toLowerCase() === "public";
  }, []);

  return (
    <SearchResultsScreen
      logScope="Browse Page"
      backgroundPreset="blue"
      modes={BROWSE_MODES}
      onResultPress={handleResultPress}
      resultFilter={filterPublicOnly}
    />
  );
}
