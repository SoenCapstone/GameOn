import React from "react";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ClerkLoaded, SignedOut } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { WELCOME_PATH } from "@/constants/navigation";

export default function TabLayout() {
  return (
    <ClerkLoaded>
      {
        <SignedOut>
          <Redirect href={WELCOME_PATH} />
        </SignedOut>
      }

      <NativeTabs>
        <NativeTabs.Trigger name="home">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="text.rectangle.page" selectedColor="white" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="globe.europe.africa.fill" selectedColor="white" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="messages">
          <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="message.fill" selectedColor="white" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="spaces">
          <NativeTabs.Trigger.Label>Spaces</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="circle.grid.2x2.fill" selectedColor="white" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ClerkLoaded>
  );
}
