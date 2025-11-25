import { Stack } from "expo-router";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { HeaderButton } from "@/components/header/header-button";

const settingsHeader = () => (
  <Header
    left={<HeaderButton type="back" />}
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
    </Stack>
  );
}
