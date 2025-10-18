import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignInScreen from "@/app/(auth)/sign-in";

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

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

const mockSignIn = jest.fn();
jest.mock("@/contexts/auth", () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

jest.mock("@/constants/images", () => ({ images: { logo: 1 } }));

const TEST_PASSWORD = "secret12";

beforeEach(async () => {
  jest.clearAllMocks();

  await AsyncStorage.setItem(
    "users",
    JSON.stringify([
      {
        name: "Jane",
        birth: "01/01/1990",
        email: "jane@example.com",
        pwd: TEST_PASSWORD,
      },
    ]),
  );
});

describe("SignInScreen", () => {
  it("signs in with valid credentials", async () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("example@example.com"),
      "jane@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("**********"), "secret12");
    fireEvent.press(getByText("Log In"));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith("demo-token"));
  });

  it("shows an error with invalid credentials", async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <SignInScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText("example@example.com"),
      "jane@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("**********"), "wrongpass");
    fireEvent.press(getByText("Log In"));

    expect(await findByText("Invalid email or password")).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
