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
import { SearchProvider } from "@/contexts/search-context";
import { FeatureFlagsProvider } from "@/components/feature-flags/feature-flags-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import * as Clarity from "@microsoft/react-native-clarity";


import { StripeProvider } from "@stripe/stripe-react-native";
Clarity.initialize("v55c1jb3f3", {
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  SystemUI.setBackgroundColorAsync("black");

  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!stripeKey) {
    throw new Error("Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }

  return (
    <StripeProvider
      publishableKey={stripeKey}
      merchantIdentifier="merchant.com.gameon"
      urlScheme="gameon"
    >
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
              <ActionSheetProvider>
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
                        name="(contexts)"
                        options={{ headerShown: false }}
                      />
                    </Stack>
                    <StatusBar style="auto" />
                  </ClerkLoaded>
                </SearchProvider>
              </ActionSheetProvider>
            </ThemeProvider>
          </FeatureFlagsProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </KeyboardProvider>
    </StripeProvider>
  );
}
