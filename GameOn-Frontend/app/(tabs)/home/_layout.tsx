import { Stack } from "expo-router";
import React from "react";
import Header from "@/components/header";
import { Logo } from "@/components/logo";
import PageTitle from "@/components/page-title";
import HeaderButton from "@/components/header-button";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => (
            <Header
              left={<Logo />}
              center={<PageTitle title="Home" />}
              right={
                <HeaderButton
                  type="custom"
                  route="/search"
                  icon="magnifyingglass"
                />
              }
            />
          ),
        }}
      />
    </Stack>
  );
}
