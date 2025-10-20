import React from "react";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { AccentColors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf="text.rectangle.page" selectedColor={AccentColors.blue} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="spaces">
        <Label>Spaces</Label>
        <Icon sf="circle.grid.2x2.fill" selectedColor={AccentColors.purple} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Label>Messages</Label>
        <Icon sf="message.fill" selectedColor={AccentColors.green} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" selectedColor={AccentColors.orange} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
