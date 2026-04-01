import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import WelcomeScreen from "@/app/(auth)";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  router: { push: mockPush },
}));

jest.mock("expo-blur", () => ({
  BlurView: ({ children }: { children?: React.ReactNode }) => {
    const { View } = jest.requireActual("react-native");
    return <View>{children}</View>;
  },
}));

jest.mock("expo-glass-effect", () => ({
  GlassView: ({ children }: { children?: React.ReactNode }) => {
    const { View } = jest.requireActual("react-native");
    return <View>{children}</View>;
  },
  isLiquidGlassAvailable: () => false,
}));

jest.mock("@/components/auth/welcome-hero", () => ({
  WelcomeHero: () => {
    const { Text, View } = jest.requireActual("react-native");
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

describe("WelcomeScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the current welcome hero and primary auth actions", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-hero")).toBeTruthy();
    expect(screen.getByText("Sign In")).toBeTruthy();
    expect(screen.getByText("Create Account")).toBeTruthy();
  });

  it("navigates to sign in from the welcome button", () => {
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByText("Sign In"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("navigates to sign up from the welcome button", () => {
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByText("Create Account"));

    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-up");
  });
});
