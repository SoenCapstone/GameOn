import { Alert, Platform, ToastAndroid } from "react-native";
import type { SignUpResource } from "@clerk/types";
import {
  autoFormatDateInput,
  completeVerificationAndUpsert,
  displayFormikError,
  formatDate,
  humanizeClerkError,
  parseDate,
  SignUpSchema,
  startClerkSignUp,
  toast,
} from "@/utils/sign-up";
import { EMAIL_VERIFICATION_STATUS } from "@/constants/sign-up";
import type { SignUpInputLabel } from "@/types/auth";
import { getDevSignInValues, signin } from "@/utils/sign-in";

interface MockSignUp {
  create: jest.Mock;
  prepareEmailAddressVerification: jest.Mock;
  attemptEmailAddressVerification?: jest.Mock;
}

jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  actual.Platform.OS = "ios";
  return actual;
});

const mockAlert = jest.fn();
const mockToastAndroidShow = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "ios";
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(Alert, "alert").mockImplementation(mockAlert);
  jest.spyOn(ToastAndroid, "show").mockImplementation(mockToastAndroidShow);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("displayFormikError", () => {
  const inputLabel: SignUpInputLabel = {
    label: "First name",
    placeholder: "John",
    field: "firstname",
  };

  it("returns the field error only after the field has been touched", () => {
    expect(
      displayFormikError(
        { firstname: true },
        { firstname: "First name is required" },
        inputLabel,
      ),
    ).toBe("First name is required");

    expect(
      displayFormikError(
        {},
        { firstname: "First name is required" },
        inputLabel,
      ),
    ).toBeUndefined();
  });
});

describe("SignUpSchema", () => {
  it("accepts a valid sign-up payload", async () => {
    await expect(
      SignUpSchema.validate({
        firstname: "Jane",
        lastname: "Doe",
        birth: "2000-01-01T00:00:00.000Z",
        emailAddress: "jane@example.com",
        password: "password123",
      }),
    ).resolves.toBeTruthy();
  });

  it("rejects invalid email, short password, and future birth date", async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    await expect(
      SignUpSchema.validate({
        firstname: "Jane",
        lastname: "Doe",
        birth: futureDate.toISOString(),
        emailAddress: "invalid-email",
        password: "short",
      }),
    ).rejects.toThrow();
  });
});

describe("humanizeClerkError", () => {
  it("extracts the first Clerk error message when present", () => {
    expect(
      humanizeClerkError({
        errors: [{ message: "Email already exists" }],
      }),
    ).toBe("Email already exists");
  });

  it("falls back to a generic message for malformed errors", () => {
    expect(humanizeClerkError({})).toBe("Something went wrong");
    expect(humanizeClerkError("not-json")).toBe("Something went wrong");
  });
});

describe("toast", () => {
  it("uses Alert on iOS", () => {
    Platform.OS = "ios";
    toast("Hello");
    expect(mockAlert).toHaveBeenCalledWith("Hello");
    expect(mockToastAndroidShow).not.toHaveBeenCalled();
  });

  it("uses ToastAndroid on Android", () => {
    Platform.OS = "android";
    toast("Hello");
    expect(mockToastAndroidShow).toHaveBeenCalledWith(
      "Hello",
      ToastAndroid.SHORT,
    );
  });
});

describe("startClerkSignUp", () => {
  const values = {
    firstname: "John",
    lastname: "Doe",
    emailAddress: "john@example.com",
    password: "password123",
    birth: "2000-01-01",
  };

  const mockSignUp: MockSignUp = {
    create: jest.fn(),
    prepareEmailAddressVerification: jest.fn(),
  };

  it("returns false when Clerk is not ready", async () => {
    await expect(
      startClerkSignUp(values, false, mockSignUp as unknown as SignUpResource),
    ).resolves.toBe(false);
    expect(mockSignUp.create).not.toHaveBeenCalled();
  });

  it("creates the sign-up and prepares email verification", async () => {
    mockSignUp.create.mockResolvedValue({});
    mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

    await expect(
      startClerkSignUp(values, true, mockSignUp as unknown as SignUpResource),
    ).resolves.toBe(true);

    expect(mockSignUp.create).toHaveBeenCalledWith({
      emailAddress: "john@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    });
    expect(mockSignUp.prepareEmailAddressVerification).toHaveBeenCalledWith({
      strategy: "email_code",
    });
  });

  it("surfaces Clerk sign-up errors", async () => {
    mockSignUp.create.mockRejectedValue({
      errors: [{ message: "Email already exists" }],
    });

    await expect(
      startClerkSignUp(values, true, mockSignUp as unknown as SignUpResource),
    ).resolves.toBe(false);

    expect(mockAlert).toHaveBeenCalledWith(
      "Sign up failed",
      "Email already exists",
    );
  });
});

describe("completeVerificationAndUpsert", () => {
  const values = {
    firstname: "John",
    lastname: "Doe",
    emailAddress: "john@example.com",
    password: "password123",
    birth: "2000-01-01",
  };

  const mockSetActive = jest.fn();
  const mockDeleteUserOnError = jest.fn();
  const mockUpsertUser = {
    mutateAsync: jest.fn(),
  };

  const mockSignUp: MockSignUp = {
    create: jest.fn(),
    prepareEmailAddressVerification: jest.fn(),
    attemptEmailAddressVerification: jest.fn(),
  };

  it("does nothing when Clerk is not ready", async () => {
    await completeVerificationAndUpsert(
      values,
      false,
      "123456",
      mockSignUp as unknown as SignUpResource,
      mockSetActive,
      mockUpsertUser,
      mockDeleteUserOnError,
    );

    expect(mockSignUp.attemptEmailAddressVerification).not.toHaveBeenCalled();
  });

  it("activates the session and upserts the user after successful verification", async () => {
    mockSignUp.attemptEmailAddressVerification!.mockResolvedValue({
      status: EMAIL_VERIFICATION_STATUS,
      createdSessionId: "session_123",
      createdUserId: "user_123",
    });
    mockSetActive.mockResolvedValue({});
    mockUpsertUser.mutateAsync.mockResolvedValue({});

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp as unknown as SignUpResource,
      mockSetActive,
      mockUpsertUser,
      mockDeleteUserOnError,
    );

    expect(mockSignUp.attemptEmailAddressVerification).toHaveBeenCalledWith({
      code: "123456",
    });
    expect(mockSetActive).toHaveBeenCalledWith({ session: "session_123" });
    expect(mockUpsertUser.mutateAsync).toHaveBeenCalledWith({
      id: "user_123",
      email: "john@example.com",
      firstname: "John",
      lastname: "Doe",
      imageUrl: null,
    });
  });

  it("alerts when verification is incomplete", async () => {
    mockSignUp.attemptEmailAddressVerification!.mockResolvedValue({
      status: "pending",
    });

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp as unknown as SignUpResource,
      mockSetActive,
      mockUpsertUser,
      mockDeleteUserOnError,
    );

    expect(mockAlert).toHaveBeenCalledWith(
      "Verification incomplete",
      "Please complete the required steps.",
    );
    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it("deletes the created user when backend upsert fails", async () => {
    mockSignUp.attemptEmailAddressVerification!.mockResolvedValue({
      status: EMAIL_VERIFICATION_STATUS,
      createdSessionId: "session_123",
      createdUserId: "user_123",
    });
    mockSetActive.mockResolvedValue({});
    mockUpsertUser.mutateAsync.mockRejectedValue(new Error("boom"));

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp as unknown as SignUpResource,
      mockSetActive,
      mockUpsertUser,
      mockDeleteUserOnError,
    );

    expect(mockDeleteUserOnError).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      "Error while creating profile! Please try again",
    );
  });

  it("alerts when Clerk rejects the verification code", async () => {
    mockSignUp.attemptEmailAddressVerification!.mockRejectedValue({
      errors: [{ message: "Invalid verification code" }],
    });

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp as unknown as SignUpResource,
      mockSetActive,
      mockUpsertUser,
      mockDeleteUserOnError,
    );

    expect(mockAlert).toHaveBeenCalledWith(
      "Verification failed",
      "Invalid verification code",
    );
  });
});

describe("date helpers", () => {
  it("formats and parses valid dates consistently", () => {
    const date = new Date(2024, 0, 5);
    const formatted = formatDate(date);

    expect(formatted).toBe("05/01/2024");
    expect(parseDate(formatted)?.toISOString()).toContain("2024-01-05");
  });

  it("returns null for impossible dates", () => {
    expect(parseDate("31/04/2024")).toBeNull();
    expect(parseDate("29/02/2023")).toBeNull();
  });

  it("auto-formats date input as the user types", () => {
    expect(autoFormatDateInput("1")).toBe("1");
    expect(autoFormatDateInput("1510")).toBe("15/10");
    expect(autoFormatDateInput("15102024")).toBe("15/10/2024");
    expect(autoFormatDateInput("15-10-2024")).toBe("15/10/2024");
  });
});

describe("getDevSignInValues", () => {
  it("returns null when either dev credential is missing", () => {
    delete process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL;
    delete process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;

    expect(getDevSignInValues()).toBeNull();
  });

  it("returns the configured dev credentials when both are present", () => {
    process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL = "dev@example.com";
    process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD = "dev-password";

    expect(getDevSignInValues()).toEqual({
      emailAddress: "dev@example.com",
      password: "dev-password",
    });
  });
});

describe("signInUser", () => {
  const values = {
    emailAddress: "test@example.com",
    password: "password123",
  };

  const mockSignIn = {
    create: jest.fn(),
  };

  const mockSetActive = jest.fn();

  it("returns early when Clerk is not loaded", async () => {
    await signin(values, mockSignIn as never, mockSetActive, false);
    expect(mockSignIn.create).not.toHaveBeenCalled();
  });

  it("creates a Clerk sign-in and activates the created session", async () => {
    mockSignIn.create.mockResolvedValue({
      status: EMAIL_VERIFICATION_STATUS,
      createdSessionId: "session_123",
    });

    await signin(values, mockSignIn as never, mockSetActive, true);

    expect(mockSignIn.create).toHaveBeenCalledWith({
      identifier: "test@example.com",
      password: "password123",
    });
    expect(mockSetActive).toHaveBeenCalledWith({ session: "session_123" });
  });

  it("does not activate a session when Clerk requires more steps", async () => {
    mockSignIn.create.mockResolvedValue({
      status: "needs_first_factor",
      createdSessionId: null,
    });

    await signin(values, mockSignIn as never, mockSetActive, true);

    expect(mockSetActive).not.toHaveBeenCalled();
  });

  it("surfaces Clerk sign-in errors through the shared auth alert path", async () => {
    mockSignIn.create.mockRejectedValue({
      errors: [{ message: "Invalid email or password" }],
    });

    await signin(values, mockSignIn as never, mockSetActive, true);

    expect(mockAlert).toHaveBeenCalledWith("Invalid email or password");
  });
});
