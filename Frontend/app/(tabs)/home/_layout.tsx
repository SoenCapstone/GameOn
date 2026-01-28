import { Stack } from "expo-router";
import React from "react";
import { Header } from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const homeHeader = () => (
  <Header
    left={<Logo />}
    center={<PageTitle title="Home" />}
    right={
      <Button type="custom" route="/browse" icon="globe.europe.africa.fill" />
    }
  />
);

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: homeHeader,
        }}
      />
    </Stack>
  );
}
