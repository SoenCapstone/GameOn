import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const featureFlagsHeader = () => (
  <Header
    left={<Button type="back" />}
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
