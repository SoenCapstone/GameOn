import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children ?? null,
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

const mockAlert = jest.fn();

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

jest.mock("@/constants/images", () => ({
  images: { logo: 1 },
}));

jest.mock("@/constants/auth-styles", () => ({
  authStyles: {
    safe: { flex: 1 },
    topGradient: {},
    hero: {},
    container: {},
    label: {},
    inputWrap: {},
    input: {},
    rightIcon: {},
    errorText: {},
  },
}));

jest.mock("@/constants/auth-layout", () => ({
  getAuthHeroLayout: () => ({
    FORM_PADDING_TOP: 0,
    TOP_GRADIENT_H: 0,
    RENDER_W: 0,
    RENDER_H: 0,
  }),
}));

jest.mock("@/constants/navigation", () => ({
  SIGN_UP_PATH: "/(auth)/boarding/sign-up",
}));

jest.mock("@/components/auth/input-label", () => {
  const React = require("react");
  const { Text, TextInput, View } = require("react-native");
  return {
    LabeledInput: ({
      label,
      placeholder,
      value,
      onChangeText,
      onBlur,
      secureTextEntry,
      keyboardType,
      autoCapitalize,
      error,
      testID,
    }: any) => (
      <View>
        <Text>{label}</Text>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          testID={testID || `input-${placeholder}`}
        />
        {error ? <Text testID={`error-${label}`}>{error}</Text> : null}
      </View>
    ),
  };
});

jest.mock("@/components/auth/submit-auth-button", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  const { useFormikContext } = require("formik");

  return {
    SubmitAuthButton: ({ actionMessage }: any) => {
      const { handleSubmit } = useFormikContext();
      return (
        <TouchableOpacity onPress={handleSubmit} testID="submit-button">
          <Text>{actionMessage}</Text>
        </TouchableOpacity>
      );
    },
  };
});

jest.mock("@/components/auth/password-visibility-toggle", () => ({
  PasswordVisbilityToggle: () => null,
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: any) => children ?? null,
}));

jest.mock("@/components/ui/background", () => ({
  Background: ({ children }: any) => children ?? null,
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

import SignInScreen from "@/app/(auth)/boarding/sign-in";
import { Alert } from "react-native";

describe("SignInScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(mockAlert);
    mockCreate.mockResolvedValue({
      status: "complete",
      createdSessionId: "session_123",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
