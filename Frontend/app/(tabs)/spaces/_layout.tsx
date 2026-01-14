import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";
import { useSearch, SearchProvider } from "@/contexts/search-context";

const spacesHeader = () => (
  <Header
    left={<Logo />}
    center={<PageTitle title="Spaces" />}
    right={
      <HeaderButton type="custom" route="/teams/create-team" icon="plus" />
    }
  />
);

export default function SpacesLayout() {
  return (
    <SearchProvider onlyMine={true}>
      <SpacesLayoutContent />
    </SearchProvider>
  );
}

function SpacesLayoutContent() {
  const { setQuery, setSearchActive } = useSearch();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: spacesHeader,
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
    </Stack>
  );
}
