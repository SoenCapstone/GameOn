import { Stack } from "expo-router";
import "react-native-reanimated";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";
import { useSearch } from "@/contexts/search-context";

const browseHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Browse" />}
  />
);

export default function BrowseLayout() {
  const { setQuery, setSearchActive } = useSearch();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerBackVisible: false,
          headerTitle: browseHeader,
          headerTransparent: true,
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
