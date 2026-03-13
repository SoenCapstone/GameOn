import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@clerk/clerk-expo";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
import { Providers } from "@/contexts/providers";

TimeAgo.addDefaultLocale(en);
void SystemUI.setBackgroundColorAsync("black");

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  fade: true,
});

function RootStack() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hide();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(isSignedIn)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootStack />
      <StatusBar style="auto" />
    </Providers>
  );
}
