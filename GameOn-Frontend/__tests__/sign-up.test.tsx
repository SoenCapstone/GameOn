import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { mockAlert, setupAuthTestHooks } from "@/__tests__/test-utils/auth-test-setup";

jest.mock("react-native-keyboard-controller", () => {
  const { ScrollView } = require("react-native");
  return {
    KeyboardAwareScrollView: ({ children, ...props }: any) => (
      <ScrollView {...props}>{children}</ScrollView>
    ),
  };
});

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

jest.mock("@/components/auth/sign-up-date-picker", () => ({
  SignUpDatePicker: () => null,
}));

jest.mock("@/components/privacy-disclaimer/privacy-disclaimer", () => ({
  PrivacyDisclaimer: () => null,
}));

jest.mock("@/components/sign-up/verification-input", () => {
  const { Text, View } = require("react-native");
  return {
    VerificationInput: () => (
      <View testID="verification-view">
        <Text>Verification</Text>
      </View>
    ),
  };
});

jest.mock("@/constants/navigation", () => ({
  SIGN_IN_PATH: "/(auth)/boarding/sign-in",
}));

import SignUpScreen from "@/app/(auth)/boarding/sign-up";

describe("SignUpScreen", () => {
  setupAuthTestHooks();

  beforeEach(() => {
    mockCreate.mockResolvedValue({ status: "pending" });
    mockPrepareEmailAddressVerification.mockResolvedValue({ status: "ready" });
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
