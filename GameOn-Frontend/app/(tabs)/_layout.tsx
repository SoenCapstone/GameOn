import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import React from "react";
import { View } from "react-native";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="home">
          <Label>Home</Label>
          <Icon sf="text.rectangle.page" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}
