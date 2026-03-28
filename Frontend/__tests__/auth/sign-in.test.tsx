import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import {
  mockAlert,
  renderWithQueryClient,
  setupAuthTestHooks,
} from "@/__tests__/auth/auth-test-setup";
import SignInScreen from "@/app/(auth)/sign-in";

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

jest.mock("@/utils/runtime", () => ({
  runtime: {
    isRunningInExpoGo: false,
    isDevelopment: true,
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

  it("renders the current sign-in screen with toolbar actions", () => {
    const { getByPlaceholderText, getByText } = renderWithQueryClient(
      <SignInScreen />,
    );

    expect(getByPlaceholderText("name@example.com")).toBeTruthy();
    expect(getByPlaceholderText("••••••••••••")).toBeTruthy();
    expect(getByText("Developer Account")).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
    expect(getByText("Forgot Password?")).toBeTruthy();
  });

  it("signs in with typed credentials from the toolbar button", async () => {
    const { getByPlaceholderText, getByText } = renderWithQueryClient(
      <SignInScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "password123");

    fireEvent.press(getByText("Sign In"));

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

  it("uses the developer account credentials when the toolbar dev action is pressed", async () => {
    process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL = "dev@example.com";
    process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD = "dev-password";

    const { getByText } = renderWithQueryClient(<SignInScreen />);

    fireEvent.press(getByText("Developer Account"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        identifier: "dev@example.com",
        password: "dev-password",
      });
    });
  });

  it("shows a dev sign-in alert when developer credentials are missing", async () => {
    const { getByText } = renderWithQueryClient(<SignInScreen />);

    fireEvent.press(getByText("Developer Account"));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Dev Sign In Error",
        "Missing EXPO_PUBLIC_DEV_LOGIN_EMAIL or EXPO_PUBLIC_DEV_LOGIN_PASSWORD in your .env file.",
      );
    });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows validation errors instead of calling Clerk for an empty submit", async () => {
    const { getByText, findByTestId } = renderWithQueryClient(<SignInScreen />);

    fireEvent.press(getByText("Sign In"));

    const emailError = await findByTestId("error-Email address");
    const passwordError = await findByTestId("error-Password");

    expect(emailError.props.children).toBe("Email is required");
    expect(passwordError.props.children).toBe("Password is required");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows format and length validation errors for invalid values", async () => {
    const { getByPlaceholderText, getByText, findByTestId } =
      renderWithQueryClient(<SignInScreen />);

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "invalid-email",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "short");

    fireEvent.press(getByText("Sign In"));

    const emailError = await findByTestId("error-Email address");
    const passwordError = await findByTestId("error-Password");

    expect(emailError.props.children).toBe("Enter a valid email");
    expect(passwordError.props.children).toBe(
      "Password must be at least 8 characters",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("surfaces Clerk failures through the auth alert path", async () => {
    mockCreate.mockRejectedValueOnce({
      errors: [{ message: "Invalid email or password" }],
    });

    const { getByPlaceholderText, getByText } = renderWithQueryClient(
      <SignInScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "test@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "wrongpass");
    fireEvent.press(getByText("Sign In"));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Invalid email or password");
    });

    expect(mockSetActive).not.toHaveBeenCalled();
  });
});
