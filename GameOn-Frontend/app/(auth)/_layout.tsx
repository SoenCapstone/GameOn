import React from "react";
import "react-native-reanimated";
import { Stack, Redirect } from "expo-router";
import { ClerkLoaded, SignedIn, SignedOut } from "@clerk/clerk-expo";

import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";
import { HOME_PATH } from "@/constants/navigation";

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

export default function AuthLayout() {
  return (
    <ClerkLoaded>
      <SignedIn>
        {!__DEV__ && <Redirect href={HOME_PATH} />}
      </SignedIn>

      <SignedOut>
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
      </SignedOut>
    </ClerkLoaded>
  );
}
