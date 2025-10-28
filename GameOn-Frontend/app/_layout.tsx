import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as SystemUI from "expo-system-ui";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthGate, AuthProvider } from "@/contexts/auth";
import { FeatureFlagsProvider } from "@/contexts/featureFlags/FeatureFlagsContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  SystemUI.setBackgroundColorAsync("black");

  return (
    <FeatureFlagsProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <AuthGate>
            <QueryClientProvider client={queryClient}>
              <SearchProvider>
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
                </Stack>
                <StatusBar style="auto" />
              </SearchProvider>
            </QueryClientProvider>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </FeatureFlagsProvider>
  );
}
