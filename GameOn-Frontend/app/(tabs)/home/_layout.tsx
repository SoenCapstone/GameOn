import { Stack } from "expo-router";
import React from "react";
import Header from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import PageTitle from "@/components/header/page-title";
import HeaderButton from "@/components/header-button";

const header = () => (
  <Header left={<Logo />} center={<PageTitle title="Home" />} right={<HeaderButton
                  type="custom"
                  route="/search"
                  icon="magnifyingglass"
                />} />
);

export default function HomeLayout() {
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
