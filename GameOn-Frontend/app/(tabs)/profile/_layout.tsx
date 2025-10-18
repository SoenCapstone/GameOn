import { Stack } from "expo-router";
import React from "react";
import ProfileHeader from "@/components/header/variants/profile-header";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: () => <ProfileHeader />,
        }}
      />
    </Stack>
  );
}
