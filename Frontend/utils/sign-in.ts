import * as Yup from "yup";
import type { SignInResource, SetActive } from "@clerk/types";
import {
  VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT,
  VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED,
  VALIDATION_PASSWORD_LENGTH,
  VALIDTION_PASSWORD_MESSAGE_LENGTH,
  VALIDATION_PASSWORD_MESSAGE_REQUIRED,
  EMAIL_VERIFICATION_STATUS,
} from "@/constants/sign-up";
import { toast } from "@/utils/toast";
import { UserSignIn } from "@/types/auth";
import { humanizeClerkError } from "@/utils/sign-up";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("Sign In Utils");

export const SignInSchema = Yup.object({
  emailAddress: Yup.string()
    .email(VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT)
    .required(VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED),
  password: Yup.string()
    .min(VALIDATION_PASSWORD_LENGTH, VALIDTION_PASSWORD_MESSAGE_LENGTH)
    .required(VALIDATION_PASSWORD_MESSAGE_REQUIRED),
});

export const getDevSignInValues = (): UserSignIn | null => {
  const email = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL;
  const password = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  return {
    emailAddress: email,
    password,
  };
};

export const signin = async (
  values: UserSignIn,
  signIn: SignInResource,
  setActive: SetActive,
  isLoaded: boolean,
): Promise<void> => {
  if (!isLoaded) return;

  try {
    const result = await signIn.create({
      identifier: values.emailAddress,
      password: values.password,
    });

    if (result.status === EMAIL_VERIFICATION_STATUS) {
      if (!result.createdSessionId) {
        log.info("Session ID not created");
        return;
      }
      await setActive({ session: result.createdSessionId });
    } else {
      log.info("Additional verification required:", result);
    }
  } catch (err: unknown) {
    toast.error("Sign In Failed", {
      description: humanizeClerkError(err),
    });
  }
};
