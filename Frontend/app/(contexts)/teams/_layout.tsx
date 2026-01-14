import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";
import { useSearch } from "@/contexts/search-context";

const createTeamHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Create Team" />}
  />
);

export default function TeamsLayout() {
  const { setQuery, setSearchActive } = useSearch();
  return (
    <Stack>
      <Stack.Screen
        name="create-team"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: createTeamHeader,
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
          headerSearchBarOptions: {
            hideNavigationBar: false,
            placement: "automatic",
            onChangeText: (event) => {
              const text = event.nativeEvent.text || "";
              setQuery(text);
            },
            onFocus: () => setSearchActive(true),
            onBlur: () => setSearchActive(false),
          },
        }}
      />
      <Stack.Screen
        name="[id]/settings/index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackVisible: false,
        }}
      />
    </Stack>
  );
}
