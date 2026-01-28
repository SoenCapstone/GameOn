import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const profileHeader = () => (
  <Header
    left={<Logo />}
    center={<PageTitle title="Profile" />}
    right={<Button type="custom" icon="gear" route="/(contexts)/settings" />}
  />
);

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: profileHeader,
        }}
      />
    </Stack>
  );
}
