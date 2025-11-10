import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SignInScreen from "@/app/(auth)/sign-in";

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  return { Ionicons: (p: any) => React.createElement("Icon", p) };
});

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children ?? null,
}));

const mockCreate = jest.fn();
const mockSetActive = jest.fn();
jest.mock("@clerk/clerk-expo", () => ({
  useSignIn: () => ({
    signIn: { create: mockCreate },
    setActive: mockSetActive,
    isLoaded: true,
  }),
}));

jest.mock("@/constants/images", () => ({ images: { logo: 1 } }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SignInScreen", () => {
  it("attempts to sign in with credentials", async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("example@example.com"),
      "test@example.com"
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "password123");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows validation errors for empty fields", async () => {
    const { getByText, findByText } = render(<SignInScreen />);

    fireEvent.press(getByText("Sign In"));

    expect(await findByText("Email is required")).toBeTruthy();
    expect(await findByText("Password is required")).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
