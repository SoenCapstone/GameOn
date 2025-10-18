import { Stack } from "expo-router";
import React from "react";
import SpacesHeader from "@/components/header/variants/spaces-header";

export default function SpacesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <SpacesHeader />,
        }}
      />
    </Stack>
  );
}
