import React from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

function LeagueHeader() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={`League ${String(id)}`} />}
      right={<HeaderButton type="custom" icon="gearshape" route="" />}
    />
  );
}


export default function LeaguesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          header: () => <LeagueHeader />,
        }}
      />
    </Stack>
  );
}
