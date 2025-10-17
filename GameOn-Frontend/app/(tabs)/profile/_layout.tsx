import { Stack } from "expo-router";
import React from "react";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
