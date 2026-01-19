import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

function LeagueHeader() {
  const { name, id } = useLocalSearchParams<{ name?: string; id?: string }>();

  const prettyId =
    id?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";

  const title = name ?? prettyId ?? "League";

  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={<HeaderButton type="custom" icon="gearshape" onPress={() => {}} />}
    />
  );
}

export default function LeaguesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <LeagueHeader />,
          headerBackVisible: false,

        }}
      />

      <Stack.Screen
        name="[id]/games"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <LeagueHeader />,
          headerBackVisible: false,

        }}
      />

      <Stack.Screen
        name="[id]/teams"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <LeagueHeader />,
          headerBackVisible: false,

        }}
      />
    </Stack>
  );
}
