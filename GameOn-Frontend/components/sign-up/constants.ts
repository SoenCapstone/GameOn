import { passwordInput } from "@/components/sign-in/constants";

const FIRST_NAME_LABEL = "First name";
const FIRST_NAME_FIELD = "firstname";
const FIRST_NAME_AUTO_CAPITALIZE = "words" as const;
const FIRST_NAME_PLACEHOLDER = "John";

const LAST_NAME_LABEL = "Last name";
const LAST_NAME_FIELD = "lastname";
const LAST_NAME_AUTO_CAPITALIZE = "words" as const;
const LAST_NAME_PLACEHOLDER = "Doe";

export const PASSWORD_LABEL = "Password";
export const PASSWORD_FIELD = "password";
export const PASSWORD_PLACEHOLDER = "••••••••••••";

export const EMAIL_LABEL = "Email address";
export const EMAIL_FIELD = "emailAddress";
export const EMAIL_PLACEHOLDER = "name@example.com";
export const EMAIL_AUTO_CAPITALIZE = "none" as const;
export const EMAIL_KEYBOARD_TYPE = "email-address";

export const EMPTY_STRING = "";
export const SIGN_UP_MESSAGE = "Sign Up";
export const SIGN_IN_MESSAGE = "Sign In";
export const DATE_UP_BIRTH_MESSAGE = "Date of Birth";

export const SIGN_IN_TEXT = "Already have an account?";

export const VALIDATION_FIRST_NAME_MESSAGE_LENGTH = "Enter your first name";
export const VALIDATION_FIRST_NAME_MESSAGE_REQUIRED = "First name is required";
export const VALIDATION_LAST_NAME_MESSAGE_LENGTH = "Enter your last name";
export const VALIDATION_LAST_NAME_MESSAGE_REQUIRED = "Last name is required";
export const VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT = "Enter a valid email";
export const VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED = "Email is required";
export const VALIDTION_PASSWORD_MESSAGE_LENGTH =
  "Password must be at least 8 characters";
export const VALIDATION_PASSWORD_MESSAGE_REQUIRED = "Password is required";
export const VALIDATION_PASSWORD_LENGTH = 8;
export const VALIDATION_DOB_MESSAGE_REQUIRED = "Date of birth is required";
export const VALIDATION_DOB_MESSAGE_PAST = "Enter a valid past date";

export const initialSignUpValues = {
  firstname: EMPTY_STRING,
  lastname: EMPTY_STRING,
  birth: new Date().toISOString(),
  emailAddress: EMPTY_STRING,
  password: EMPTY_STRING,
};

export const signUpInputLabels = (showPassword: boolean) => [
  {
    label: FIRST_NAME_LABEL,
    placeholder: FIRST_NAME_PLACEHOLDER,
    field: FIRST_NAME_FIELD,
    autoCapitalize: FIRST_NAME_AUTO_CAPITALIZE,
  },
  {
    label: LAST_NAME_LABEL,
    placeholder: LAST_NAME_PLACEHOLDER,
    field: LAST_NAME_FIELD,
    autoCapitalize: LAST_NAME_AUTO_CAPITALIZE,
  },
  {
    label: EMAIL_LABEL,
    placeholder: EMAIL_PLACEHOLDER,
    field: EMAIL_FIELD,
    autoCapitalize: EMAIL_AUTO_CAPITALIZE,
    keyboardType: EMAIL_KEYBOARD_TYPE,
  },
  passwordInput(showPassword),
];

export const EMAIL_VERIFICATION_STATUS = "complete";
export const SIGN_UP_SUCCESS_MESSAGE = "Profile created successfully!";
export const SIGN_UP_CLERK_ERROR_MESSAGE =
  "Clerk is not loaded or user is not signed in";
export const SIGN_UP_BACKEND_ERROR_MESSAGE =
  "Error while creating profile! Please try again";
