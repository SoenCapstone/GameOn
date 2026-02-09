import { Stack } from "expo-router";
import React from "react";

export default function PostLayout() {
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
