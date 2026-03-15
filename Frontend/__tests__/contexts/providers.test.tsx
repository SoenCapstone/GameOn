import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { Providers } from "@/contexts/providers";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { ClerkProvider } from "@clerk/clerk-expo";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}));

jest.mock("@react-navigation/native", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    DarkTheme: { dark: true, colors: { background: "black" } },
    DefaultTheme: { dark: false, colors: { background: "white" } },
    ThemeProvider: jest.fn(
      ({
        children,
      }: {
        children: React.ReactNode;
        value: unknown;
      }) => ReactModule.createElement(ReactModule.Fragment, null, children),
    ),
  };
});

jest.mock("@stripe/stripe-react-native", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    StripeProvider: jest.fn(
      ({
        children,
      }: {
        children: React.ReactNode;
      }) => ReactModule.createElement(ReactModule.Fragment, null, children),
    ),
  };
});

jest.mock("react-native-keyboard-controller", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    KeyboardProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock("@clerk/clerk-expo", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    ClerkProvider: jest.fn(
      ({
        children,
      }: {
        children: React.ReactNode;
      }) => ReactModule.createElement(ReactModule.Fragment, null, children),
    ),
  };
});

jest.mock("@clerk/clerk-expo/token-cache", () => ({
  tokenCache: { getToken: jest.fn() },
}));

jest.mock(
  "@/components/feature-flags/feature-flags-context",
  () => {
    const ReactModule =
      jest.requireActual<typeof import("react")>("react");

    return {
      FeatureFlagsProvider: ({
        children,
      }: {
        children: React.ReactNode;
      }) =>
        ReactModule.createElement(ReactModule.Fragment, null, children),
    };
  },
);

jest.mock("@expo/react-native-action-sheet", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    ActionSheetProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock("@/contexts/search-context", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    SearchProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock("@/contexts/referee-context", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    RefereeProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock("@/features/messaging/provider", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");

  return {
    MessagingProvider: ({
      children,
    }: {
      children: React.ReactNode;
    }) => ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

const mockedUseColorScheme = jest.mocked(useColorScheme);
const mockedThemeProvider = jest.mocked(ThemeProvider);
const mockedStripeProvider = jest.mocked(StripeProvider);
const mockedClerkProvider = jest.mocked(ClerkProvider);

describe("providers", () => {
  const originalStripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const originalClerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "clerk_test_123";
    mockedUseColorScheme.mockReturnValue("light");
  });

  afterAll(() => {
    if (originalStripeKey === undefined) {
      delete process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    } else {
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalStripeKey;
    }

    if (originalClerkKey === undefined) {
      delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
    } else {
      process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkKey;
    }
  });

  it("renders children with the configured provider keys", () => {
    const { getByText } = render(
      <Providers>
        <Text>child content</Text>
      </Providers>,
    );

    expect(getByText("child content")).toBeTruthy();
    expect(mockedThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({ value: DarkTheme }),
      undefined,
    );
    expect(mockedStripeProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        publishableKey: "pk_test_123",
        merchantIdentifier: "merchant.com.gameon",
        urlScheme: "gameon",
      }),
      undefined,
    );
    expect(mockedClerkProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        publishableKey: "clerk_test_123",
      }),
      undefined,
    );
  });

  it("uses the dark navigation theme", () => {
    mockedUseColorScheme.mockReturnValue("dark");

    render(
      <Providers>
        <Text>dark child</Text>
      </Providers>,
    );

    expect(mockedThemeProvider).toHaveBeenCalledWith(
      expect.objectContaining({ value: DarkTheme }),
      undefined,
    );
  });

  it("throws when the Stripe publishable key is missing", () => {
    delete process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    expect(() =>
      render(
        <Providers>
          <Text>missing stripe key</Text>
        </Providers>,
      ),
    ).toThrow("Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  });

  it("throws when the Clerk publishable key is missing", () => {
    delete process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    expect(() =>
      render(
        <Providers>
          <Text>missing clerk key</Text>
        </Providers>,
      ),
    ).toThrow("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
  });
});
