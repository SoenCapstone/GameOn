import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";


jest.mock("expo-router", () => {
  const pushMock = jest.fn();
  return {
    useRouter: () => ({ push: pushMock }),
    __esModule: true,
    pushMock,
  };
});

jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => children ?? null,
}));

jest.mock("react-native-safe-area-context", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...jest.requireActual("react-native-safe-area-context"),
    SafeAreaView: RN.View,
  };
});

jest.mock("@/constants/auth-styles", () => ({
  authStyles: {
    safe: { flex: 1 },
    container: { flex: 1 },
    hero: { alignItems: "center", justifyContent: "center" },
  },
}));

jest.mock("@/components/auth/DisplayLogo", () => ({
  DisplayLogo: () => null,
}));
jest.mock("@/components/privacy-disclaimer/privacy-disclaimer", () => ({
  PrivacyDisclaimer: () => null,
}));

import WelcomeScreen from "../app/(auth)/welcome";

describe("WelcomeScreen", () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    pushMock =
      jest.requireMock("expo-router").pushMock || jest.fn();
    pushMock.mockClear();
  });

  it("renders header and both buttons", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText(/welcome to gameon/i)).toBeTruthy();
    expect(screen.getByText(/login/i)).toBeTruthy();
    expect(screen.getByText(/sign up/i)).toBeTruthy();
  });

  it("routes to sign-in when Login pressed", () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText(/login/i));
    expect(pushMock).toHaveBeenCalledWith("/(auth)/sign-in");
  });

  it("routes to sign-up when Sign up pressed", () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText(/sign up/i));
    expect(pushMock).toHaveBeenCalledWith("/(auth)/sign-up");
  });
});
