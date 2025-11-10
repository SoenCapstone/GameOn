import { Stack } from "expo-router";
import React from "react";
import Header from "@/components/header/header";
import { Logo } from "@/components/header/logo";
import { AddButton } from "@/components/header/add-button";
import PageTitle from "@/components/header/page-title";

const header = () => (
  <Header left={<Logo />} center={<PageTitle title="Spaces" />} right={<AddButton/>}/>
);

export default function SpacesLayout() {
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
