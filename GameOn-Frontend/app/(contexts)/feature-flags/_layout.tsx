import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

const featureFlagsHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Feature Flags" />}
  />
);

export default function FlagsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: featureFlagsHeader,
        }}
      />
    </Stack>
  );
}
