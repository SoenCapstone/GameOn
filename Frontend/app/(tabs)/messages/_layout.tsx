import React from "react";
import { Stack } from "expo-router";
import { MessagingProvider } from "@/features/messaging/provider";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const messagesHeader = () => (
  <Header
    left={<Logo />}
    center={<PageTitle title="Messages" />}
    right={<Button type="custom" route="/messages/new" icon="plus" />}
  />
);

export default function MessagesLayout() {
  return (
    <MessagingProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerTransparent: true,
            headerShadowVisible: false,
            headerTitle: messagesHeader,
          }}
        />
      </Stack>
    </MessagingProvider>
  );
}
