import { Stack } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useSearch, SearchProvider } from "@/contexts/search-context";

function SpacesHeader() {
  const { activeMode } = useSearch();
  const mode = activeMode ?? "teams";

  const handleComingSoon = () => {
    Alert.alert("Coming soon", "Tournaments creation is on the way.");
  };

  const right =
    mode === "leagues" ? (
      <Button type="custom" route="/leagues/create-league" icon="plus" />
    ) : mode === "tournaments" ? (
      <Button type="custom" icon="plus" onPress={handleComingSoon} />
    ) : (
      <Button type="custom" route="/teams/create" icon="plus" />
    );

  return (
    <Header
      left={<Logo />}
      center={<PageTitle title="Spaces" />}
      right={right}
    />
  );
}

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
          headerTitle: () => <SpacesHeader />,
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
