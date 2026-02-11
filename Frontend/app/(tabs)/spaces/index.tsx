import React from "react";
import { useRouter } from "expo-router";
import { SearchResultsScreen } from "@/components/browse/search-results-screen";
import { SearchResult, SPACES_MODES } from "@/components/browse/constants";

export default function Spaces() {
  const router = useRouter();

const handleResultPress = React.useCallback(
  (result: SearchResult) => {
    if (result.type === "team") {
      router.push(`/teams/${result.id}`);
    }
    else if (result.type === "league") {
      router.push(`/leagues/${result.id}`);
    }
  },
  [router],
);


  return (
    <SearchResultsScreen
      logScope="Spaces Page"
      backgroundPreset="purple"
      modes={SPACES_MODES}
      onResultPress={handleResultPress}
    />
  );
}
