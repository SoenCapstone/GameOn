import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

const header = () => (
  <Header left={<Logo />} center={<PageTitle title="Teams" />} />
);

const createTeamHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Create Team" />}
  />
);

export default function TeamsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: header,
        }}
      />
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
