import { useCallback } from "react";
import { useRouter } from "expo-router";
import { SearchResultsScreen } from "@/components/browse/search-results-screen";
import { SearchResult, Tabs } from "@/components/browse/constants";
import { useSearch } from "@/contexts/search-context";
import { View } from "react-native";
import { ContentArea } from "@/components/ui/content-area";

export default function Browse() {
  const router = useRouter();
  const { searchActive } = useSearch();

  const handleResultPress = useCallback(
    (result: SearchResult) => {
      if (result.type === "team") {
        router.push(`/teams/${result.id}`);
      } else if (result.type === "league") {
        router.push(`/leagues/${result.id}`);
      }
    },
    [router],
  );

  const filterPublicOnly = useCallback((result: SearchResult) => {
    return result.privacy?.toLowerCase() === "public";
  }, []);

  if (searchActive) {
    return (
      <SearchResultsScreen
        logScope="Explore Page"
        backgroundPreset="red"
        modes={Tabs}
        onResultPress={handleResultPress}
        resultFilter={filterPublicOnly}
      />
    );
  }

  return (
    <ContentArea
      scrollable
      backgroundProps={{
        preset: "red",
      }}
    >
      <View />
    </ContentArea>
  );
}
