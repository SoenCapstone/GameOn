import React from "react";
import { Stack } from "expo-router";
import { MessagingProvider } from "@/features/messaging/provider";

export default function MessagesLayout() {
  return (
    <MessagingProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTransparent: true,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </MessagingProvider>
  );
}
