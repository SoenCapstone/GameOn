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

const mockAlert = jest.fn();

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

const mockCreate = jest.fn();
const mockPrepareEmailAddressVerification = jest.fn();
const mockSetActive = jest.fn();

jest.mock("@clerk/clerk-expo", () => ({
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: mockCreate,
      prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
    },
    setActive: mockSetActive,
  }),
}));

jest.mock("@/components/auth/InputLabel", () => {
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

jest.mock("@/components/auth/SignUpDatePicker", () => ({
  SignUpDatePicker: () => null,
}));

jest.mock("@/components/privacy-disclaimer/privacy-disclaimer", () => ({
  PrivacyDisclaimer: () => null,
}));

jest.mock("@/components/sign-up/VerificationInput", () => ({
  VerificationInput: () => {
    const { Text, View } = require("react-native");
    return (
      <View testID="verification-view">
        <Text>Verification</Text>
      </View>
    );
  },
}));

jest.mock("@/components/auth/SubmitAuthButton", () => {
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

jest.mock("@/components/auth/PasswordVisibilityToggle", () => ({
  PasswordVisbilityToggle: () => null,
}));

jest.mock("@/components/auth/AuthSwitchLink", () => ({
  AuthSwitchLink: () => null,
}));

jest.mock("@/components/auth/AuthLinearGradient", () => ({
  AuthLinearGradient: ({ children }: any) => children ?? null,
}));

jest.mock("@/components/ui/content-area", () => ({
  ContentArea: ({ children }: any) => children ?? null,
}));

jest.mock("@/constants/navigation", () => ({
  SIGN_IN_PATH: "/(auth)/boarding/sign-in",
}));

import SignUpScreen from "@/app/(auth)/boarding/sign-up";
import { Alert } from "react-native";

describe("SignUpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(mockAlert);
    mockCreate.mockResolvedValue({ status: "pending" });
    mockPrepareEmailAddressVerification.mockResolvedValue({ status: "ready" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the sign-up form with all input fields", () => {
    const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

    expect(getByPlaceholderText("John")).toBeTruthy();
    expect(getByPlaceholderText("Doe")).toBeTruthy();
    expect(getByPlaceholderText("name@example.com")).toBeTruthy();
    expect(getByPlaceholderText("••••••••••••")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("submits form with valid values and shows verification view", async () => {
    const { getByPlaceholderText, getByTestId, findByTestId } = render(
      <SignUpScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "jane@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        emailAddress: "jane@example.com",
        password: "testtest",
      });
    });

    await waitFor(() => {
      expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: "email_code",
      });
    });

    const verificationView = await findByTestId("verification-view");
    expect(verificationView).toBeTruthy();
  });

  it("validates required fields and shows error messages", async () => {
    const { getByTestId } = render(<SignUpScreen />);

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it("validates email format", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "invalid-email",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it("validates password length (minimum 8 characters)", async () => {
    const { getByPlaceholderText, getByTestId } = render(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "jane@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "short");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it("handles sign-up error gracefully", async () => {
    const clerkError = {
      errors: [{ message: "Email already exists" }],
    };
    mockCreate.mockRejectedValueOnce(clerkError);

    const { getByPlaceholderText, getByTestId, queryByTestId } = render(
      <SignUpScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "existing@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");

    fireEvent.press(getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Sign up failed",
        "Email already exists",
      );
    });

    expect(queryByTestId("verification-view")).toBeNull();
  });
});
