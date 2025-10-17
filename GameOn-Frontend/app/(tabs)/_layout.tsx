import React from "react";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Label>Home</Label>
        <Icon sf="paperplane.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
