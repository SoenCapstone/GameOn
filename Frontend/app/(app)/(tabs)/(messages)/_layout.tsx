import React from "react";
import { Stack } from "expo-router";

export default function MessagesLayout() {
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
