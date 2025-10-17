import React from "react";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs iconColor="white">
      <NativeTabs.Trigger name="home">
        <Label>Home</Label>
        <Icon sf="text.rectangle.page" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="spaces">
        <Label>Spaces</Label>
        <Icon sf="circle.grid.2x2.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Label>Messages</Label>
        <Icon sf="message.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
