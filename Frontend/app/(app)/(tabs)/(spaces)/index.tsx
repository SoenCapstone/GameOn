import { useCallback, useState } from "react";
import { router, Stack } from "expo-router";
import { RefreshControl } from "react-native";
import * as Haptics from "expo-haptics";
import { SearchResultsScreen } from "@/components/search/search-results-screen";
import { ContentArea } from "@/components/ui/content-area";
import { useSearch } from "@/hooks/search/use-search";
import { createScopedLog } from "@/utils/logger";
import { Logo } from "@/components/header/logo";
import {
  Tabs,
  teamsTab,
  type Modes,
  type SearchValue,
} from "@/constants/search";
import { usePostHogFlags } from "@/hooks/use-posthog-flags";
import { usePostHog } from "posthog-react-native";

const pageLog = createScopedLog("Spaces Page");

function SpacesToolbar({ search }: { readonly search: SearchValue }) {
  const { setQuery, setSearchActive } = search;
  const { canCreateTeam, canCreateLeague } = usePostHogFlags();
  const posthog = usePostHog();
  const showMenu = canCreateTeam || canCreateLeague;
  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.View hidesSharedBackground>
          <Logo />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Screen.Title>Spaces</Stack.Screen.Title>
      {showMenu ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Menu icon="plus">
            {canCreateTeam ? (
              <Stack.Toolbar.MenuAction
                icon="person.2"
                onPress={() => { posthog.capture("create_team_tapped"); router.push("/teams/create"); }}
              >
                Create a Team
              </Stack.Toolbar.MenuAction>
            ) : null}
            {canCreateLeague ? (
              <Stack.Toolbar.MenuAction
                icon="trophy"
                onPress={() => { posthog.capture("create_league_tapped"); router.push("/leagues/create"); }}
              >
                Create a League
              </Stack.Toolbar.MenuAction>
            ) : null}
          </Stack.Toolbar.Menu>
        </Stack.Toolbar>
      ) : null}
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
  const posthog = usePostHog();
  const search = useSearch({ member: true, scope: "Spaces Page" });
  const { query, searchActive, refetch } = search;
  const [mode, setMode] = useState<Modes>(teamsTab.key);
  const [refreshing, setRefreshing] = useState(false);

  const selectedMode = Tabs.find((m) => m.key === mode) ?? teamsTab;
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
                if (next) {
                  posthog.capture("spaces_tab_switched", { tab: next.key });
                  setMode(next.key);
                }
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
