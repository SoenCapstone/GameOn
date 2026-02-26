import { Alert, ToastAndroid, Platform } from "react-native";
import type { FormikErrors, FormikTouched } from "formik";
import type { ClerkAPIError } from "@clerk/types";
import * as Yup from "yup";
import {
  VALIDATION_FIRST_NAME_MESSAGE_LENGTH,
  VALIDATION_FIRST_NAME_MESSAGE_REQUIRED,
  VALIDATION_LAST_NAME_MESSAGE_LENGTH,
  VALIDATION_LAST_NAME_MESSAGE_REQUIRED,
  VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT,
  VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED,
  VALIDTION_PASSWORD_MESSAGE_LENGTH,
  VALIDATION_PASSWORD_MESSAGE_REQUIRED,
  VALIDATION_DOB_MESSAGE_REQUIRED,
  VALIDATION_DOB_MESSAGE_PAST,
  EMAIL_VERIFICATION_STATUS,
  VALIDATION_PASSWORD_LENGTH,
  SIGN_UP_BACKEND_ERROR_MESSAGE,
} from "@/components/sign-up/constants";
import {
  SetActiveFn,
  SignUpInputLabel,
  User,
  SignUpResourceType,
  UpsertUserMutation,
} from "@/components/sign-up/models";

export const displayFormikError = (
  touched: FormikTouched<User>,
  errors: FormikErrors<User>,
  inputLabel: SignUpInputLabel,
): string | undefined => {
  const fieldKey = inputLabel.field as keyof User;
  return touched?.[fieldKey] && errors?.[fieldKey]
    ? (errors[fieldKey] as string)
    : undefined;
};

export const SignUpSchema = Yup.object({
  firstname: Yup.string()
    .trim()
    .min(2, VALIDATION_FIRST_NAME_MESSAGE_LENGTH)
    .required(VALIDATION_FIRST_NAME_MESSAGE_REQUIRED),
  lastname: Yup.string()
    .trim()
    .min(2, VALIDATION_LAST_NAME_MESSAGE_LENGTH)
    .required(VALIDATION_LAST_NAME_MESSAGE_REQUIRED),
  emailAddress: Yup.string()
    .email(VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT)
    .required(VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED),
  password: Yup.string()
    .min(VALIDATION_PASSWORD_LENGTH, VALIDTION_PASSWORD_MESSAGE_LENGTH)
    .required(VALIDATION_PASSWORD_MESSAGE_REQUIRED),
  birth: Yup.string()
    .required(VALIDATION_DOB_MESSAGE_REQUIRED)
    .test("dob-valid", VALIDATION_DOB_MESSAGE_PAST, (v) => {
      if (!v) return false;
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      return d < today;
    }),
});

type ClerkErrorResponse = {
  errors?: ClerkAPIError[];
};

export const humanizeClerkError = (err: unknown): string => {
  try {
    const json =
      typeof err === "string" ? JSON.parse(err) : (err as ClerkErrorResponse);
    const first = json?.errors?.[0];
    return first?.message || "Something went wrong";
  } catch {
    return "Something went wrong";
  }
};

export const toast = (msg: string): void => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert(msg);
};

export const startClerkSignUp = async (
  values: User,
  isLoaded: boolean,
  signUp: SignUpResourceType | undefined,
  setPendingVerification: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> => {
  if (!isLoaded || !signUp) {
    return;
  }

  try {
    await signUp.create({
      emailAddress: values.emailAddress,
      password: values.password,
      firstName: values.firstname,
      lastName: values.lastname,
    });
    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    setPendingVerification(true);
  } catch (e: unknown) {
    Alert.alert("Sign up failed", humanizeClerkError(e));
  }
};

export const completeVerificationAndUpsert = async (
  values: User,
  isLoaded: boolean,
  otpCode: string,
  signUp: SignUpResourceType | undefined,
  setActive: SetActiveFn,
  upsertUser: UpsertUserMutation,
  deleteUserOnError: () => Promise<void>,
): Promise<void> => {
  if (!isLoaded || !signUp) {
    return;
  }
  try {
    const attempt = await signUp.attemptEmailAddressVerification({
      code: otpCode,
    });

    if (attempt.status === EMAIL_VERIFICATION_STATUS) {
      if (!attempt.createdSessionId) {
        Alert.alert("Verification incomplete", "Session could not be created.");
        return;
      }

      await setActive({ session: attempt.createdSessionId });

      try {
        if (!attempt.createdUserId) {
          throw new Error("User ID not created");
        }

        await upsertUser.mutateAsync({
          id: attempt.createdUserId,
          email: values.emailAddress,
          firstname: values.firstname,
          lastname: values.lastname,
        });
      } catch {
        await deleteUserOnError();
        toast(SIGN_UP_BACKEND_ERROR_MESSAGE);
        return;
      }
    } else {
      Alert.alert(
        "Verification incomplete",
        "Please complete the required steps.",
      );
    }
  } catch (e: unknown) {
    Alert.alert("Verification failed", humanizeClerkError(e));
  }
};

export const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseDate = (dateString: string): Date | null => {
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;

  const day = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10) - 1;
  const year = Number.parseInt(parts[2], 10);

  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year))
    return null;

  const date = new Date(year, month, day);
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
};

export const autoFormatDateInput = (input: string): string => {
  const numbers = input.replaceAll(/\D/g, "");

  if (numbers.length === 8) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  }

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};
