import { Stack } from "expo-router";
import React from "react";
import Header from "@/components/header";
import { Logo } from "@/components/logo";
import PageTitle from "@/components/page-title";

export default function MessagesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => (
            <Header left={<Logo />} center={<PageTitle title="Messages" />} />
          ),
        }}
      />
    </Stack>
  );
}
