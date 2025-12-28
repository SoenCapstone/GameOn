import React from "react";
import { Stack } from "expo-router";

export default function MessagesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // we build our own headers inside screens
      }}
    />
  );
}
