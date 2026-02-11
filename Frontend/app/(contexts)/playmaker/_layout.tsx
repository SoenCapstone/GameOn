import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const playMakerHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Playmaker" />}
  />
);

export default function PlayMakerLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: playMakerHeader,
        }}
      />
    </Stack>
  );
}
