import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as SystemUI from "expo-system-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SearchProvider } from "@/contexts/SearchContext";
import { FeatureFlagsProvider } from "@/components/feature-flags/feature-flags-context";
import { KeyboardProvider } from "react-native-keyboard-controller";

const queryClient = new QueryClient();
export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  SystemUI.setBackgroundColorAsync("black");
  
  return (
    <KeyboardProvider>
      <ClerkProvider
        tokenCache={tokenCache}
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      >
        <QueryClientProvider client={queryClient}>
          <FeatureFlagsProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <SearchProvider>
                <ClerkLoaded>
                  <Stack>
                    <Stack.Screen
                      name="(auth)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="browse"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                    name="(contexts)"
                    options={{ headerShown: false }}
                    />
                  </Stack>
                  <StatusBar style="auto" />
                </ClerkLoaded>
              </SearchProvider>
            </ThemeProvider>
          </FeatureFlagsProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </KeyboardProvider>
  );
}
