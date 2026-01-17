import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

const createLeagueHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Create League" />}
  />
);

export default function LeaguesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="create-league"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: createLeagueHeader,
        }}
      />
    </Stack>
  );
}
