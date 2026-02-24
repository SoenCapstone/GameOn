import React from "react";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { AccentColors } from "@/constants/colors";
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
          <Label>Home</Label>
          <Icon sf="text.rectangle.page" selectedColor="white" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <Label>Explore</Label>
          <Icon sf="globe.europe.africa.fill" selectedColor="white" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="messages">
          <Label>Messages</Label>
          <Icon sf="message.fill" selectedColor="white" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="spaces">
          <Label>Spaces</Label>
          <Icon sf="circle.grid.2x2.fill" selectedColor="white" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ClerkLoaded>
  );
}
