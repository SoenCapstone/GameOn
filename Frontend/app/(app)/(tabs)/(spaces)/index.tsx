import { useCallback, useState } from "react";
import { router, Stack } from "expo-router";
import { RefreshControl } from "react-native";
import * as Haptics from "expo-haptics";
import { SearchResultsScreen } from "@/components/search/search-results-screen";
import { ContentArea } from "@/components/ui/content-area";
import { useSearch } from "@/hooks/search/use-search";
import { createScopedLog } from "@/utils/logger";
import { Logo } from "@/components/header/logo";
import { Tabs, type Modes, type SearchValue } from "@/constants/search";

const pageLog = createScopedLog("Spaces Page");

function SpacesToolbar({ search }: { readonly search: SearchValue }) {
  const { setQuery, setSearchActive } = search;
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Spaces</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="plus">
          <Stack.Toolbar.MenuAction
            icon="person.2"
            onPress={() => router.push("/teams/create")}
          >
            Create a Team
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction
            icon="trophy"
            onPress={() => router.push("/leagues/create")}
          >
            Create a League
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <Stack.SearchBar
        placement="integrated"
        onChangeText={(event) => {
          const text = event.nativeEvent.text || "";
          setQuery(text);
        }}
        onFocus={() => setSearchActive(true)}
        onBlur={() => setSearchActive(false)}
      />
    </>
  );
}

export default function Spaces() {
  const search = useSearch({ member: true, scope: "Spaces Page" });
  const { query, searchActive, refetch } = search;
  const [mode, setMode] = useState<Modes>(Tabs[0]!.key);
  const [refreshing, setRefreshing] = useState(false);

  const selectedMode = Tabs.find((m) => m.key === mode) ?? Tabs[0]!;
  const q = (query || "").toLowerCase().trim();
  const showTabs = !q && !searchActive;

  const handleRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
    pageLog.info("Page updated");
  }, [refetch]);

  return (
    <ContentArea
      background={{ preset: "purple" }}
      tabs={
        showTabs
          ? {
              values: Tabs.map((m) => m.label),
              selectedIndex: Tabs.findIndex((m) => m.key === selectedMode.key),
              onValueChange: (value) => {
                const next = Tabs.find((m) => m.label === value);
                if (next) setMode(next.key);
              },
            }
          : undefined
      }
      toolbar={<SpacesToolbar search={search} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <SearchResultsScreen
        scope="Spaces Page"
        search={search}
        selectedMode={selectedMode}
      />
    </ContentArea>
  );
}
