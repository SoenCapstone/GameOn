import { Stack, Redirect } from "expo-router";
import { ClerkLoaded, SignedOut } from "@clerk/clerk-expo";
import { WELCOME_PATH } from "@/constants/navigation";
import React from "react";

export default function ContextsLayout() {
  return (
    <ClerkLoaded>
      <SignedOut>
        <Redirect href={WELCOME_PATH} />
      </SignedOut>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000" },
        }}
      />
    </ClerkLoaded>
  );
}
