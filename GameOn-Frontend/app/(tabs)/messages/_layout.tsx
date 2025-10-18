import { Stack } from "expo-router";
import React from "react";
import MessagesHeader from "@/components/header/variants/messages-header";

export default function MessagesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <MessagesHeader />,
        }}
      />
    </Stack>
  );
}
