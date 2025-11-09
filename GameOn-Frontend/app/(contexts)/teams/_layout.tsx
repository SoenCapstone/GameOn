import { Stack } from "expo-router";
import React from "react";
import Header from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import PageTitle from "@/components/header/page-title";

const header = () => (
  <Header left={<Logo />} center={<PageTitle title="Teams" />} />
);

export default function TeamsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: header,
        }}
      />
    </Stack>
  );
}
