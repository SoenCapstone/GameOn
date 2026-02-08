import React from "react";
import { Stack } from "expo-router";
import { MessagingProvider, useMessagingContext } from "@/features/messaging/provider";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

function MessagesHeader() {
  const { socketState } = useMessagingContext();
  const subtitle = socketState !== "connected" ? socketState : undefined;

  return (
    <Header
      left={<Logo />}
      center={<PageTitle title="Messages" subtitle={subtitle} />}
      right={<Button type="custom" route="/messages/new" icon="plus" />}
    />
  );
}

export default function MessagesLayout() {
  return (
    <MessagingProvider>
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
    </MessagingProvider>
  );
}
