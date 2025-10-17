import { Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Messages",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
