import React from "react";
import { Stack } from "expo-router";
import { MessagingProvider } from "@/features/messaging/provider";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const newMessageHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="New Message" />}
  />
);

export default function MessagesLayout() {
  return (
    <MessagingProvider>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "#000" },
        }}
      >
        <Stack.Screen
          name="new"
          options={{
            headerBackVisible: false,
            headerTransparent: true,
            headerTitle: newMessageHeader,
          }}
        />
        <Stack.Screen
          name="[chatId]"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </MessagingProvider>
  );
}
