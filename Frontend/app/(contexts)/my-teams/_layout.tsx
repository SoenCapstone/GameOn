import { Stack } from "expo-router";
import React from "react";
import { useSearch } from "@/contexts/search-context";


export default function MyTeamsLayout() {
  const { setQuery, setSearchActive } = useSearch();
  return (
    <Stack>
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
    </Stack>
  );
}
