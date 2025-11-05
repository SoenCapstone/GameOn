import { EMPTY_STRING, EMAIL_LABEL, EMAIL_PLACEHOLDER, EMAIL_FIELD, EMAIL_AUTO_CAPITALIZE, EMAIL_KEYBOARD_TYPE, PASSWORD_LABEL, PASSWORD_PLACEHOLDER, PASSWORD_FIELD } from "../sign-up/constants";

export const initialSignInValue = { emailAddress: EMPTY_STRING, password: EMPTY_STRING };

export const FORGOT_PASSWORD_TEXT = 'Forgot password?';
export const SIGN_UP_TEXT = 'Don\'t have an account?';

export const passwordInput = (showPassword : boolean) => ({
    label: PASSWORD_LABEL,
    placeholder: PASSWORD_PLACEHOLDER,
    field: PASSWORD_FIELD,
    secureTextEntry: !showPassword,
    rightIcon: true,
  })

export const signInInputLabels = (showPassword : boolean) => [ {
    label: EMAIL_LABEL,
    placeholder: EMAIL_PLACEHOLDER,
    field: EMAIL_FIELD,
    autoCapitalize: EMAIL_AUTO_CAPITALIZE,
    keyboardType: EMAIL_KEYBOARD_TYPE,
  }, passwordInput(showPassword)];
