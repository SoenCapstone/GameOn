import { Stack } from "expo-router";
import { useTabsTitle } from "@/hooks/use-tabs-title";

export default function AppLayout() {
  const title = useTabsTitle();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title }} />
      <Stack.Screen
        name="match/[id]/index"
        options={{
          title: "",
          presentation: "formSheet",
          sheetAllowedDetents: "fitToContents",
          sheetCornerRadius: 58,
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
}
