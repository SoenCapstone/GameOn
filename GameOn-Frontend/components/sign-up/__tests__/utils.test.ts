import { Platform, Alert, ToastAndroid } from "react-native";
import {
  isIOSPadding,
  displayFormikError,
  SignUpSchema,
  humanizeClerkError,
  toast,
  startClerkSignUp,
  completeVerificationAndUpsert,
  formatDate,
  parseDate,
  autoFormatDateInput,
} from "../utils";
import { EMAIL_VERIFICATION_STATUS } from "../constants";
import type { SignUpInputLabel } from "../models";

jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  RN.Platform.OS = "ios";
  return RN;
});

const mockToastAndroidShow = jest.fn();
const mockAlert = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (ToastAndroid.show as jest.Mock) = mockToastAndroidShow;
  (Alert.alert as jest.Mock) = mockAlert;
});

describe("isIOSPadding", () => {
  it("returns 'padding' for iOS platform", () => {
    Platform.OS = "ios";
    expect(isIOSPadding()).toBe("padding");
  });

  it("returns undefined for Android platform", () => {
    Platform.OS = "android";
    expect(isIOSPadding()).toBeUndefined();
  });
});

describe("displayFormikError", () => {
  const inputLabel: SignUpInputLabel = {
    label: "First name",
    placeholder: "John",
    field: "firstname",
  };

  it("returns error message when field is touched and has error", () => {
    const touched = { firstname: true };
    const errors = { firstname: "First name is required" };
    expect(displayFormikError(touched, errors, inputLabel)).toBe(
      "First name is required",
    );
  });

  it("returns undefined when field is not touched", () => {
    const touched = {};
    const errors = { firstname: "First name is required" };
    expect(displayFormikError(touched, errors, inputLabel)).toBeUndefined();
  });

  it("returns undefined when field has no error", () => {
    const touched = { firstname: true };
    const errors = {};
    expect(displayFormikError(touched, errors, inputLabel)).toBeUndefined();
  });

  it("returns undefined when field is not touched and has no error", () => {
    const touched = {};
    const errors = {};
    expect(displayFormikError(touched, errors, inputLabel)).toBeUndefined();
  });
});

describe("SignUpSchema", () => {
  describe("firstname validation", () => {
    it("validates required firstname", async () => {
      await expect(
        SignUpSchema.validateAt("firstname", { firstname: "" }),
      ).rejects.toThrow();
    });

    it("validates minimum length of 2 characters", async () => {
      await expect(
        SignUpSchema.validateAt("firstname", { firstname: "A" }),
      ).rejects.toThrow();
      await expect(
        SignUpSchema.validateAt("firstname", { firstname: "Ab" }),
      ).resolves.toBeTruthy();
    });

    it("trims whitespace before validation", async () => {
      await expect(
        SignUpSchema.validateAt("firstname", { firstname: "  Ab  " }),
      ).resolves.toBeTruthy();
    });
  });

  describe("lastname validation", () => {
    it("validates required lastname", async () => {
      await expect(
        SignUpSchema.validateAt("lastname", { lastname: "" }),
      ).rejects.toThrow();
    });

    it("validates minimum length of 2 characters", async () => {
      await expect(
        SignUpSchema.validateAt("lastname", { lastname: "D" }),
      ).rejects.toThrow();
      await expect(
        SignUpSchema.validateAt("lastname", { lastname: "Do" }),
      ).resolves.toBeTruthy();
    });
  });

  describe("emailAddress validation", () => {
    it("validates required email", async () => {
      await expect(
        SignUpSchema.validateAt("emailAddress", { emailAddress: "" }),
      ).rejects.toThrow();
    });

    it("validates email format", async () => {
      await expect(
        SignUpSchema.validateAt("emailAddress", { emailAddress: "invalid" }),
      ).rejects.toThrow();
      await expect(
        SignUpSchema.validateAt("emailAddress", {
          emailAddress: "test@example.com",
        }),
      ).resolves.toBeTruthy();
    });
  });

  describe("password validation", () => {
    it("validates required password", async () => {
      await expect(
        SignUpSchema.validateAt("password", { password: "" }),
      ).rejects.toThrow();
    });

    it("validates minimum length of 8 characters", async () => {
      await expect(
        SignUpSchema.validateAt("password", { password: "short" }),
      ).rejects.toThrow();
      await expect(
        SignUpSchema.validateAt("password", { password: "password" }),
      ).resolves.toBeTruthy();
    });
  });

  describe("birth validation", () => {
    it("validates required birth date", async () => {
      await expect(SignUpSchema.validateAt("birth", { birth: "" })).rejects
        .toThrow();
    });

    it("validates birth date is in the past", async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      await expect(
        SignUpSchema.validateAt("birth", { birth: futureDate.toISOString() }),
      ).rejects.toThrow();

      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 20);
      await expect(
        SignUpSchema.validateAt("birth", { birth: pastDate.toISOString() }),
      ).resolves.toBeTruthy();
    });

    it("rejects invalid date strings", async () => {
      await expect(
        SignUpSchema.validateAt("birth", { birth: "invalid-date" }),
      ).rejects.toThrow();
    });
  });
});

describe("humanizeClerkError", () => {
  it("extracts error message from Clerk error object", () => {
    const error = {
      errors: [{ message: "Email already exists" }],
    };
    expect(humanizeClerkError(error)).toBe("Email already exists");
  });

  it("handles string JSON error", () => {
    const errorString = JSON.stringify({
      errors: [{ message: "Invalid password" }],
    });
    expect(humanizeClerkError(errorString)).toBe("Invalid password");
  });

  it("returns default message when error structure is invalid", () => {
    expect(humanizeClerkError({})).toBe("Something went wrong");
    expect(humanizeClerkError({ errors: [] })).toBe("Something went wrong");
  });

  it("returns default message when JSON parsing fails", () => {
    expect(humanizeClerkError("invalid json")).toBe("Something went wrong");
  });

  it("handles null or undefined errors", () => {
    expect(humanizeClerkError(null)).toBe("Something went wrong");
    expect(humanizeClerkError(undefined)).toBe("Something went wrong");
  });
});

describe("toast", () => {
  it("shows ToastAndroid on Android platform", () => {
    Platform.OS = "android";
    toast("Test message");
    expect(mockToastAndroidShow).toHaveBeenCalledWith(
      "Test message",
      ToastAndroid.SHORT,
    );
    expect(mockAlert).not.toHaveBeenCalled();
  });

  it("shows Alert on iOS platform", () => {
    Platform.OS = "ios";
    toast("Test message");
    expect(mockAlert).toHaveBeenCalledWith("Test message");
    expect(mockToastAndroidShow).not.toHaveBeenCalled();
  });
});

describe("startClerkSignUp", () => {
  const mockSetPendingVerification = jest.fn();
  const mockSignUp = {
    create: jest.fn(),
    prepareEmailAddressVerification: jest.fn(),
  };
  const values = {
    firstname: "John",
    lastname: "Doe",
    emailAddress: "john@example.com",
    password: "password123",
    birth: "2000-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns early if Clerk is not loaded", async () => {
    await startClerkSignUp(
      values,
      false,
      mockSignUp,
      mockSetPendingVerification,
    );
    expect(mockSignUp.create).not.toHaveBeenCalled();
    expect(mockSetPendingVerification).not.toHaveBeenCalled();
  });

  it("creates sign-up and prepares verification when loaded", async () => {
    mockSignUp.create.mockResolvedValue({});
    mockSignUp.prepareEmailAddressVerification.mockResolvedValue({});

    await startClerkSignUp(
      values,
      true,
      mockSignUp,
      mockSetPendingVerification,
    );

    expect(mockSignUp.create).toHaveBeenCalledWith({
      emailAddress: "john@example.com",
      password: "password123",
    });
    expect(mockSignUp.prepareEmailAddressVerification).toHaveBeenCalledWith({
      strategy: "email_code",
    });
    expect(mockSetPendingVerification).toHaveBeenCalledWith(true);
  });

  it("shows alert on error", async () => {
    const error = {
      errors: [{ message: "Email already exists" }],
    };
    mockSignUp.create.mockRejectedValue(error);

    await startClerkSignUp(
      values,
      true,
      mockSignUp,
      mockSetPendingVerification,
    );

    expect(mockAlert).toHaveBeenCalledWith(
      "Sign up failed",
      "Email already exists",
    );
    expect(mockSetPendingVerification).not.toHaveBeenCalled();
  });
});

describe("completeVerificationAndUpsert", () => {
  const mockSetActive = jest.fn();
  const mockUpsertUser = {
    mutateAsync: jest.fn(),
  };
  const mockSignUp = {
    attemptEmailAddressVerification: jest.fn(),
  };
  const values = {
    firstname: "John",
    lastname: "Doe",
    emailAddress: "john@example.com",
    password: "password123",
    birth: "2000-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns early if Clerk is not loaded", async () => {
    await completeVerificationAndUpsert(
      values,
      false,
      "123456",
      mockSignUp,
      mockSetActive,
      mockUpsertUser,
    );
    expect(mockSignUp.attemptEmailAddressVerification).not.toHaveBeenCalled();
  });

  it("completes verification and upserts user on success", async () => {
    const createdSessionId = "session_123";
    const createdUserId = "user_123";
    mockSignUp.attemptEmailAddressVerification.mockResolvedValue({
      status: EMAIL_VERIFICATION_STATUS,
      createdSessionId,
      createdUserId,
    });
    mockSetActive.mockResolvedValue({});
    mockUpsertUser.mutateAsync.mockResolvedValue({});

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp,
      mockSetActive,
      mockUpsertUser,
    );

    expect(mockSignUp.attemptEmailAddressVerification).toHaveBeenCalledWith({
      code: "123456",
    });
    expect(mockSetActive).toHaveBeenCalledWith({
      session: createdSessionId,
    });
    expect(mockUpsertUser.mutateAsync).toHaveBeenCalledWith({
      id: createdUserId,
      email: "john@example.com",
      firstname: "John",
      lastname: "Doe",
    });
  });

  it("shows alert when verification status is not complete", async () => {
    mockSignUp.attemptEmailAddressVerification.mockResolvedValue({
      status: "pending",
    });

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp,
      mockSetActive,
      mockUpsertUser,
    );

    expect(mockAlert).toHaveBeenCalledWith(
      "Verification incomplete",
      "Please complete the required steps.",
    );
    expect(mockSetActive).not.toHaveBeenCalled();
    expect(mockUpsertUser.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows alert on verification error", async () => {
    const error = {
      errors: [{ message: "Invalid verification code" }],
    };
    mockSignUp.attemptEmailAddressVerification.mockRejectedValue(error);

    await completeVerificationAndUpsert(
      values,
      true,
      "123456",
      mockSignUp,
      mockSetActive,
      mockUpsertUser,
    );

    expect(mockAlert).toHaveBeenCalledWith(
      "Verification failed",
      "Invalid verification code",
    );
  });
});

describe("formatDate", () => {
  it("formats date correctly with zero-padding", () => {
    const date = new Date(2023, 0, 5); // January 5, 2023
    expect(formatDate(date)).toBe("05/01/2023");
  });

  it("formats date without zero-padding when not needed", () => {
    const date = new Date(2023, 9, 15); // October 15, 2023
    expect(formatDate(date)).toBe("15/10/2023");
  });

  it("handles single digit day and month", () => {
    const date = new Date(2023, 0, 1); // January 1, 2023
    expect(formatDate(date)).toBe("01/01/2023");
  });

  it("handles year correctly", () => {
    const date = new Date(2000, 5, 20);
    expect(formatDate(date)).toBe("20/06/2000");
  });
});

describe("parseDate", () => {
  it("parses valid date string correctly", () => {
    const date = parseDate("15/10/2023");
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(15);
    expect(date!.getMonth()).toBe(9); // October is month 9 (0-indexed)
    expect(date!.getFullYear()).toBe(2023);
  });

  it("returns null for invalid format", () => {
    expect(parseDate("2023-10-15")).toBeNull();
    expect(parseDate("15-10-2023")).toBeNull();
    expect(parseDate("15/10")).toBeNull();
    expect(parseDate("invalid")).toBeNull();
  });

  it("returns null for invalid date values", () => {
    expect(parseDate("32/01/2023")).toBeNull(); // Invalid day
    expect(parseDate("15/13/2023")).toBeNull(); // Invalid month
    expect(parseDate("15/10/abc")).toBeNull(); // Invalid year
  });

  it("handles edge cases", () => {
    expect(parseDate("29/02/2023")).toBeNull(); // Not a leap year
    expect(parseDate("29/02/2024")).not.toBeNull(); // Leap year
    expect(parseDate("31/04/2023")).toBeNull(); // April has 30 days
  });

  it("handles single digit day and month", () => {
    const date = parseDate("01/01/2023");
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(1);
    expect(date!.getMonth()).toBe(0);
  });
});

describe("autoFormatDateInput", () => {
  it("formats complete date (8 digits)", () => {
    expect(autoFormatDateInput("15102023")).toBe("15/10/2023");
  });

  it("formats partial date (1-2 digits)", () => {
    expect(autoFormatDateInput("1")).toBe("1");
    expect(autoFormatDateInput("15")).toBe("15");
  });

  it("formats partial date (3-4 digits)", () => {
    expect(autoFormatDateInput("151")).toBe("15/1");
    expect(autoFormatDateInput("1510")).toBe("15/10");
  });

  it("formats partial date (5-8 digits)", () => {
    expect(autoFormatDateInput("15102")).toBe("15/10/2");
    expect(autoFormatDateInput("151020")).toBe("15/10/20");
    expect(autoFormatDateInput("1510202")).toBe("15/10/202");
    expect(autoFormatDateInput("15102023")).toBe("15/10/2023");
  });

  it("removes non-digit characters", () => {
    expect(autoFormatDateInput("15/10/2023")).toBe("15/10/2023");
    expect(autoFormatDateInput("15-10-2023")).toBe("15/10/2023");
    expect(autoFormatDateInput("abc15102023def")).toBe("15/10/2023");
  });

  it("handles empty string", () => {
    expect(autoFormatDateInput("")).toBe("");
  });

  it("truncates to 8 digits maximum", () => {
    expect(autoFormatDateInput("151020231234")).toBe("15/10/2023");
  });
});

