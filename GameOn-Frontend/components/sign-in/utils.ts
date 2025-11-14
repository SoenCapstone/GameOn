import * as Yup from "yup";
import {
  VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT,
  VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED,
  VALIDATION_PASSWORD_LENGTH,
  VALIDTION_PASSWORD_MESSAGE_LENGTH,
  VALIDATION_PASSWORD_MESSAGE_REQUIRED,
  EMAIL_VERIFICATION_STATUS,
} from "@/components/sign-up/constants";
import { SetActiveFn, UserSignIn } from "@/components/sign-up/models";
import { humanizeClerkError, toast } from "@/components/sign-up/utils";

export const SignInSchema = Yup.object({
  emailAddress: Yup.string()
    .email(VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT)
    .required(VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED),
  password: Yup.string()
    .min(VALIDATION_PASSWORD_LENGTH, VALIDTION_PASSWORD_MESSAGE_LENGTH)
    .required(VALIDATION_PASSWORD_MESSAGE_REQUIRED),
});

export const login = async (
  values: UserSignIn,
  signIn: any,
  setActive: SetActiveFn,
  isLoaded: boolean,
) => {
  if (!isLoaded) return;

  try {
    const result = await signIn.create({
      identifier: values?.emailAddress,
      password: values?.password,
    });

    if (result.status === EMAIL_VERIFICATION_STATUS) {
      await setActive({ session: result.createdSessionId });
    } else {
      console.log("Additional verification required:", result);
    }
  } catch (err) {
    toast(humanizeClerkError(err));
  }
};
