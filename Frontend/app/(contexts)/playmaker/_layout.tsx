import { Stack } from "expo-router";
import React from "react";

export default function PlayMakerLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]/index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
