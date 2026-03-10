import { ReactNode } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FeatureFlagsProvider } from "@/components/feature-flags/feature-flags-context";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { SearchProvider } from "@/contexts/search-context";
import { RefereeProvider } from "@/contexts/referee-context";
import { HeaderHeightProvider } from "@/contexts/header-height-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

interface ProvidersProps {
  readonly children: ReactNode;
}

const queryClient = new QueryClient();

export function Providers({ children }: Readonly<ProvidersProps>) {
  const colorScheme = useColorScheme();
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!stripeKey) {
    throw new Error("Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }

  if (!clerkKey) {
    throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StripeProvider
        publishableKey={stripeKey}
        merchantIdentifier="merchant.com.gameon"
        urlScheme="gameon"
      >
        <KeyboardProvider>
          <ClerkProvider tokenCache={tokenCache} publishableKey={clerkKey}>
            <QueryClientProvider client={queryClient}>
              <FeatureFlagsProvider>
                <ActionSheetProvider>
                  <SearchProvider>
                    <RefereeProvider>
                      <HeaderHeightProvider>{children}</HeaderHeightProvider>
                    </RefereeProvider>
                  </SearchProvider>
                </ActionSheetProvider>
              </FeatureFlagsProvider>
            </QueryClientProvider>
          </ClerkProvider>
        </KeyboardProvider>
      </StripeProvider>
    </ThemeProvider>
  );
}
