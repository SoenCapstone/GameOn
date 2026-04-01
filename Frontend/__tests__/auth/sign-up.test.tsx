import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import {
  mockAlert,
  renderWithQueryClient,
  setupAuthTestHooks,
} from "@/__tests__/auth/auth-test-setup";
import SignUpScreen from "@/app/(auth)/sign-up";

const mockCreate = jest.fn();
const mockPrepareEmailAddressVerification = jest.fn();
const mockAttemptEmailAddressVerification = jest.fn();
const mockSetActive = jest.fn();
const mockDeleteUser = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("@clerk/clerk-expo", () => ({
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: mockCreate,
      prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
      attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
    },
    setActive: mockSetActive,
  }),
  useClerk: () => ({
    user: {
      delete: mockDeleteUser,
    },
  }),
}));

jest.mock("@/hooks/use-upsert-user", () => ({
  useUpsertUser: () => ({
    isPending: false,
    mutateAsync: mockMutateAsync,
  }),
}));

jest.mock("@/components/auth/sign-up-date-picker", () => ({
  SignUpDatePicker: () => null,
}));

describe("SignUpScreen", () => {
  setupAuthTestHooks();

  beforeEach(() => {
    mockCreate.mockResolvedValue({ status: "pending" });
    mockPrepareEmailAddressVerification.mockResolvedValue({ status: "ready" });
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: "complete",
      createdSessionId: "session_123",
      createdUserId: "user_123",
    });
    mockSetActive.mockResolvedValue({});
    mockMutateAsync.mockResolvedValue({});
  });

  it("renders the current sign-up form with its toolbar submit", () => {
    const { getByPlaceholderText, getByText } = renderWithQueryClient(
      <SignUpScreen />,
    );

    expect(getByPlaceholderText("John")).toBeTruthy();
    expect(getByPlaceholderText("Doe")).toBeTruthy();
    expect(getByPlaceholderText("name@example.com")).toBeTruthy();
    expect(getByPlaceholderText("••••••••••••")).toBeTruthy();
    expect(getByText("Sign Up")).toBeTruthy();
  });

  it("creates the account and switches into verification mode", async () => {
    const { getByPlaceholderText, getByText, findByPlaceholderText } =
      renderWithQueryClient(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "jane@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");

    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        emailAddress: "jane@example.com",
        password: "testtest",
        firstName: "Jane",
        lastName: "Doe",
      });
    });

    expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({
      strategy: "email_code",
    });

    const verificationInput = await findByPlaceholderText("123456");
    expect(verificationInput).toBeTruthy();
    expect(getByText("Verify Email")).toBeTruthy();
  });

  it("submits the verification code and upserts the created user", async () => {
    const { getByPlaceholderText, getByText } = renderWithQueryClient(
      <SignUpScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "jane@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(mockPrepareEmailAddressVerification).toHaveBeenCalled();
    });

    fireEvent.changeText(getByPlaceholderText("123456"), "654321");
    fireEvent.press(getByText("Verify Email"));

    await waitFor(() => {
      expect(mockAttemptEmailAddressVerification).toHaveBeenCalledWith({
        code: "654321",
      });
    });

    expect(mockSetActive).toHaveBeenCalledWith({ session: "session_123" });
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: "user_123",
      email: "jane@example.com",
      firstname: "Jane",
      lastname: "Doe",
      imageUrl: null,
    });
  });

  it("shows validation errors instead of attempting sign-up with empty fields", async () => {
    const { getByText, findByTestId } = renderWithQueryClient(<SignUpScreen />);

    fireEvent.press(getByText("Sign Up"));

    const firstNameError = await findByTestId("error-First name");
    const lastNameError = await findByTestId("error-Last name");
    const emailError = await findByTestId("error-Email address");
    const passwordError = await findByTestId("error-Password");

    expect(firstNameError.props.children).toBe("First name is required");
    expect(lastNameError.props.children).toBe("Last name is required");
    expect(emailError.props.children).toBe("Email is required");
    expect(passwordError.props.children).toBe("Password is required");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows invalid email and short password validation messages", async () => {
    const { getByPlaceholderText, getByText, findByTestId } =
      renderWithQueryClient(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "invalid-email",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "short");

    fireEvent.press(getByText("Sign Up"));

    const emailError = await findByTestId("error-Email address");
    const passwordError = await findByTestId("error-Password");

    expect(emailError.props.children).toBe("Enter a valid email");
    expect(passwordError.props.children).toBe(
      "Password must be at least 8 characters",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows a Clerk alert and stays on the sign-up form when account creation fails", async () => {
    mockCreate.mockRejectedValueOnce({
      errors: [{ message: "Email already exists" }],
    });

    const { getByPlaceholderText, getByText, queryByPlaceholderText } =
      renderWithQueryClient(<SignUpScreen />);

    fireEvent.changeText(getByPlaceholderText("John"), "Jane");
    fireEvent.changeText(getByPlaceholderText("Doe"), "Doe");
    fireEvent.changeText(
      getByPlaceholderText("name@example.com"),
      "existing@example.com",
    );
    fireEvent.changeText(getByPlaceholderText("••••••••••••"), "testtest");
    fireEvent.press(getByText("Sign Up"));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Sign up failed",
        "Email already exists",
      );
    });

    expect(queryByPlaceholderText("123456")).toBeNull();
  });
});
