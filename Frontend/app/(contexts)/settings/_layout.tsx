import { Stack } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import React from "react";

const settingsHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Settings" />}
  />
);
const refereeSportsHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Sports" />}
  />
);

const refereeRegionsHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Regions" />}
  />
);

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerBackVisible: false,
          headerTitle: settingsHeader,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerBackVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="referee-regions"
        options={{
          headerBackVisible: false,
          headerTitle: refereeRegionsHeader,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="referee-sports"
        options={{
          headerBackVisible: false,
          headerTitle: refereeSportsHeader,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
