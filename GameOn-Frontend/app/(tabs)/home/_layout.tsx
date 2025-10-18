import { Stack } from "expo-router";
import React from "react";
import HomeHeader from "@/components/header/variants/home-header";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <HomeHeader />,
        }}
      />
    </Stack>
  );
}
