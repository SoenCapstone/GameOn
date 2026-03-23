import React from "react";
import { Stack } from "expo-router";

const transparentOptions = {
  headerTransparent: true,
  headerShadowVisible: false,
  headerBackVisible: false,
};

export default function MatchContextLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]/score" options={transparentOptions} />
    </Stack>
  );
}
