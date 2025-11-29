import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";

const profileHeader = () => (
  <Header left={<Logo />} center={<PageTitle title="Profile" />} />
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
      <Stack.Screen
        name="editProfile"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: profileHeader,
        }}
      />
    </Stack>
  );
}
