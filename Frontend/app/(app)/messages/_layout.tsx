import React from "react";
import { Stack } from "expo-router";
import { MessagingProvider } from "@/features/messaging/provider";

export default function MessagesLayout() {
  return (
    <MessagingProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#000" },
          headerBackVisible: false,
          headerTransparent: true,
        }}
      >
        <Stack.Screen name="new/message" />
        <Stack.Screen name="new/group" />
        <Stack.Screen name="[id]" />
      </Stack>
    </MessagingProvider>
  );
}
