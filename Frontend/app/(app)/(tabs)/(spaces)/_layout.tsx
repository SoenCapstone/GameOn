import { Stack } from "expo-router";
import React from "react";

export default function SpacesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
