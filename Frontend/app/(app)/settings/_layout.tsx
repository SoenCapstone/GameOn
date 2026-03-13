import { Stack } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";

const settingsHeader = () => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Settings" />}
  />
);

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerBackVisible: false,
          headerTitle: settingsHeader,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{
          headerBackVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="referee/regions"
        options={{
          headerBackVisible: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="referee/sports"
        options={{
          headerBackVisible: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
