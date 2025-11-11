import { Stack } from "expo-router";
import "react-native-reanimated";
import React from "react";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

const signInHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Sign In" />}
  />
);
const signUpHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
    center={<PageTitle title="Create Account" />}
  />
);

export default function BoardingLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="sign-in"
        options={{
          headerTitle: signInHeader,
          headerBackVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerTitle: signUpHeader,
          headerBackVisible: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
