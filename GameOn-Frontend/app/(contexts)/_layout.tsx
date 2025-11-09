// app/(contexts)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function ContextsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000" },
      }}
    />
  );
}
