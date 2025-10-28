import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";

const spacesHeader = () => (
  <Header left={<Logo />} center={<PageTitle title="Spaces" />} />
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
