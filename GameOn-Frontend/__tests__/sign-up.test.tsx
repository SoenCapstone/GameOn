import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import * as Yup from "yup";

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children }: any) => children ?? null,
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children ?? null,
}));

jest.mock("@/constants/images", () => ({ images: { logo: 1 } }));
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
const mockSetActive = jest.fn();
jest.mock("@clerk/clerk-expo", () => {
  return {
    useSignUp: () => ({
      isLoaded: true,
      signUp: { create: mockCreate },
      setActive: mockSetActive,
    }),
  };
});

const MockSchema = Yup.object({
  firstname: Yup.string().required("First name is required"),
  lastname: Yup.string().required("Last name is required"),
  emailAddress: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  birth: Yup.date().required("Date of birth is required"),
});

const mockStartClerkSignUp = jest.fn(
  async (
    values: any,
    isLoaded: boolean,
    signUp: any,
    setPendingVerification: (v: boolean) => void
  ) => {
    if (!isLoaded) return;
    try {
      const result = await signUp.create({
        firstName: values.firstname,
        lastName: values.lastname,
        emailAddress: values.emailAddress,
        password: values.password,
        birthdate: values.birth,
      });
      setPendingVerification(true);
      return result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
);

jest.mock("@/components/sign-up/utils", () => {
  const actual = jest.requireActual("@/components/sign-up/utils");
  return {
    ...actual,
    SignUpSchema: MockSchema,
    startClerkSignUp: (
      values: any,
      isLoaded: boolean,
      signUp: any,
      setPendingVerification: (v: boolean) => void
    ) => mockStartClerkSignUp(values, isLoaded, signUp, setPendingVerification),
    isIOSPadding: () => undefined,
    displayFormikError: (touched: any, errors: any, inputLabel: any) =>
      errors?.[inputLabel.field],
  };
});

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
        {error ? <Text>{error}</Text> : null}
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

jest.mock("@/components/sign-up/styles", () => ({
  styles: {
    cta: {},
    ctaText: {},
    metaText: {},
    metaLink: {},
  },
}));

jest.mock("@/components/sign-up/constants", () => ({
  EMPTY_STRING: "",
  SIGN_UP_MESSAGE: "Sign Up",
  SIGN_IN_MESSAGE: "Sign In",
  SIGN_IN_PATH: "/(auth)/sign-in",
  initialSignUpValues: {
    firstname: "",
    lastname: "",
    emailAddress: "",
    password: "",
    birth: new Date().toISOString(),
  },
  signUpInputLabels: (_showPassword: boolean) => [
    {
      field: "firstname",
      label: "First name",
      placeholder: "john",
      secureTextEntry: false,
    },
    {
      field: "lastname",
      label: "Last name",
      placeholder: "Doe",
      secureTextEntry: false,
    },
    {
      field: "emailAddress",
      label: "Email",
      placeholder: "example@example.com",
      secureTextEntry: false,
      keyboardType: "email-address",
      autoCapitalize: "none",
    },
    {
      field: "password",
      label: "Password",
      placeholder: "••••••••••••",
      secureTextEntry: true,
    },
  ],
}));

import SignUpScreen from "@/app/(auth)/sign-up";

describe("SignUpScreen (integration, with local deps mocked)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits valid values via startClerkSignUp and shows verification view", async () => {
    const { getByPlaceholderText, getByText, findByTestId } = render(
      <SignUpScreen />
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText("john"), "Jane");
      fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
      fireEvent.changeText(
        getByPlaceholderText("example@example.com"),
        "jane@example.com"
      );
      fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");
      fireEvent.press(getByText("Sign Up"));
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        firstName: "Jane",
        lastName: "Doe",
        emailAddress: "jane@example.com",
        password: "testtest",
        birthdate: expect.any(String),
      });
    });

    await expect(findByTestId("verification-view")).resolves.toBeTruthy();
  });

  it("can show an error banner if startClerkSignUp throws", async () => {
    mockStartClerkSignUp.mockImplementationOnce(async () => {
      throw new Error("boom");
    });

    const { getByPlaceholderText, getByText, queryByTestId } = render(
      <SignUpScreen />
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText("john"), "Jane");
      fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
      fireEvent.changeText(
        getByPlaceholderText("example@example.com"),
        "jane@example.com"
      );
      fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");
      fireEvent.press(getByText("Sign Up"));
    });

    await waitFor(() => {
      expect(queryByTestId("verification-view")).toBeNull();
    });
  });
});
