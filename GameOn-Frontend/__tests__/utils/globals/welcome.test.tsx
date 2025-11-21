import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  router: { push: mockPush },
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

jest.mock("expo-glass-effect", () => ({
  GlassView: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
  isLiquidGlassAvailable: () => false,
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.mock("react-native-safe-area-context", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...jest.requireActual("react-native-safe-area-context"),
    SafeAreaView: RN.View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("@/constants/auth-styles", () => ({
  authStyles: {
    safe: { flex: 1 },
    container: { flex: 1 },
    hero: { alignItems: "center", justifyContent: "center" },
  },
}));

jest.mock("@/components/auth/welcome-hero", () => ({
  WelcomeHero: () => {
    const { Text, View } = require("react-native");
    return (
      <View testID="welcome-hero">
        <Text>Welcome to GameOn</Text>
      </View>
    );
  },
}));

jest.mock("@/components/privacy-disclaimer/privacy-disclaimer", () => ({
  PrivacyDisclaimer: () => null,
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children, style }: any) => {
    const { View } = require("react-native");
    return <View style={style}>{children}</View>;
  },
}));

jest.mock("@/components/ui/background", () => ({
  Background: ({ children }: any) => {
    const { View } = require("react-native");
    return <View>{children}</View>;
  },
}));

import WelcomeScreen from "@/app/(auth)/boarding";

describe("WelcomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it("renders welcome message and both buttons", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText(/welcome to gameon/i)).toBeTruthy();
    expect(screen.getByText(/sign in/i)).toBeTruthy();
    expect(screen.getByText(/create account/i)).toBeTruthy();
  });

  it("routes to sign-in when Sign In button is pressed", () => {
    render(<WelcomeScreen />);
    const signInButton = screen.getByText(/sign in/i);
    fireEvent.press(signInButton);

    expect(mockPush).toHaveBeenCalledWith("/(auth)/boarding/sign-in");
  });

  it("routes to sign-up when Create Account button is pressed", () => {
    render(<WelcomeScreen />);
    const signUpButton = screen.getByText(/create account/i);
    fireEvent.press(signUpButton);

    expect(mockPush).toHaveBeenCalledWith("/(auth)/boarding/sign-up");
  });

  it("displays the welcome hero", () => {
    render(<WelcomeScreen />);
    expect(screen.getByTestId("welcome-hero")).toBeTruthy();
  });
});