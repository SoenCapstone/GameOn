import { Stack, useLocalSearchParams } from "expo-router";
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

function DynamicTeamHeader() {
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const title = params.name ?? (params.id ? `Team ${params.id}` : "Team");
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        <HeaderButton
          type="custom"
          route="/browse"
          icon="gear"
        />
      }
    />
  );
}

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
        name="dynamic-page"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: DynamicTeamHeader,
        }}
      />
    </Stack>
  );
}
