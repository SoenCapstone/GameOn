import React from "react";
import { useRouter } from "expo-router";
import { SearchResultsScreen } from "@/components/browse/search-results-screen";
import { SearchResult, SPACES_MODES } from "@/components/browse/constants";

export default function Spaces() {
  const router = useRouter();

  const handleResultPress = React.useCallback(
  (result: SearchResult) => {
    if (result.type === "team") {
      router.push(`../(contexts)/my-teams/${result.id}`);
      return;
    }

    if (result.type === "league") {
  router.push({
    pathname: "../(contexts)/leagues/[id]",
    params: {
      id: result.id,
      name:
        (result as any).name ??
        (result as any).title ??
        (result as any).displayName ??
        (result as any).label ??
        "League 1",
    },
  });
  return;
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
