import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import {
  mockAlert,
  setupAuthTestHooks,
} from "@/__tests__/auth/auth-test-setup";
import SignInScreen from "@/app/(auth)/sign-in";
jest.mock("react-native-keyboard-controller", () => {
  const { ScrollView } = jest.requireActual("react-native");
  return {
    KeyboardAwareScrollView: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <ScrollView {...props}>{children}</ScrollView>
    ),
  };
});

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

const mockCreate = jest.fn();
const mockSetActive = jest.fn();

jest.mock("@clerk/clerk-expo", () => ({
  useSignIn: () => ({
    signIn: {
      create: mockCreate,
    },
    setActive: mockSetActive,
    isLoaded: true,
  }),
}));

jest.mock("@/constants/navigation", () => ({
  SIGN_UP_PATH: "/(auth)/boarding/sign-up",
}));

jest.mock("@/components/sign-in/styles", () => ({
  styles: {
    forgotWrap: {},
    forgotText: {},
    statusBox: {},
    statusText: {},
    metaText: {},
    metaLink: {},
  },
}));

describe("SignInScreen", () => {
  setupAuthTestHooks();

  beforeEach(() => {
    mockCreate.mockResolvedValue({
      status: "complete",
      createdSessionId: "session_123",
    });
  });

  it("renders the sign-in form with all input fields", () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    expect(getByPlaceholderText("name@example.com")).toBeTruthy();
    expect(getByPlaceholderText("••••••••••••")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("attempts to sign in with valid credentials", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "password123");
    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({
        session: "session_123",
      });
    });
  });

  it("shows validation errors for empty fields", async () => {
    const { getByTestId, findByTestId } = render(<SignInScreen />);

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });

    const emailError = await findByTestId("error-Email address");
    const passwordError = await findByTestId("error-Password");

    expect(emailError).toBeTruthy();
    expect(passwordError).toBeTruthy();
  });

  it("validates email format", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "invalid-email",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "password123");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it("validates password length (minimum 8 characters)", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "short");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it("handles sign-in error gracefully", async () => {
    const clerkError = {
      errors: [{ message: "Invalid email or password" }],
    };
    mockCreate.mockRejectedValueOnce(clerkError);

    const { getByPlaceholderText, getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "wrongpass");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Invalid email or password");
    });

    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it("handles incomplete verification status", async () => {
    mockCreate.mockResolvedValueOnce({
      status: "needs_first_factor",
      createdSessionId: null,
    });

    const { getByPlaceholderText, getByTestId } = render(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "password123");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(mockSetActive).not.toHaveBeenCalled();
  });
});
