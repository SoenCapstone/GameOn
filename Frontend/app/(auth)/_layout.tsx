import React from "react";
import "react-native-reanimated";
import { Stack } from "expo-router";

import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const signInHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Sign In" />}
  />
);

const signUpHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Create Account" />}
  />
);

export default function AuthLayout() {
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
