import { useEffect } from "react";
import { Stack } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { usePostHog } from "posthog-react-native";
import { useTabsTitle } from "@/hooks/use-tabs-title";

export default function AppLayout() {
  const title = useTabsTitle();
  const { user } = useUser();
  const posthog = usePostHog();

  useEffect(() => {
    if (!user) return;
    posthog.identify(user.id, {
      firstName: user.firstName,
      lastName: user.lastName,
      $name: `${user.firstName} ${user.lastName}`,
    });
    posthog.capture("$set", { $unset: ["$email"] });
  }, [user?.id]);

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
      <Stack.Screen
        name="match/[id]/score"
        options={{
          title: "",
          presentation: "formSheet",
          // sheetAllowedDetents: "fitToContents",
          sheetAllowedDetents: [0.4, 1],
          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
    </Stack>
  );
}
