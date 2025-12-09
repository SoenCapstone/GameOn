import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

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
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: spacesHeader,
        }}
      />
    </Stack>
  );
}
