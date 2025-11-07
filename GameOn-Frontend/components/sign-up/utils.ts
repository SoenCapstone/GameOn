import {
  Alert,
  ToastAndroid,
  Platform,
} from 'react-native';
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
  VALIDATION_PASSWORD_LENGTH
} from './constants';
import { SetActiveFn, SignUpInputLabel, User } from '@/components/sign-up/models';
import type { FormikErrors, FormikTouched } from "formik";
import * as Yup from 'yup';

export const isIOSPadding = () => Platform.OS === "ios" ? "padding" : undefined;

export const displayFormikError = (touched : FormikTouched<any> , errors :FormikErrors<any>, inputLabel: SignUpInputLabel) => {
    return (touched?.[inputLabel.field] &&
            errors?.[inputLabel.field]
                    ? errors?.[inputLabel.field]
                    : undefined)
}

export const SignUpSchema = Yup.object({
  firstname: Yup.string()
    .trim()
    .min(2, VALIDATION_FIRST_NAME_MESSAGE_LENGTH)
    .required(VALIDATION_FIRST_NAME_MESSAGE_REQUIRED),
    lastname: Yup.string()
    .trim()
    .min(2, VALIDATION_LAST_NAME_MESSAGE_LENGTH)
    .required(VALIDATION_LAST_NAME_MESSAGE_REQUIRED),
  emailAddress: Yup.string().email(VALIDATION_EMAIL_FORMAT_MESSAGE_FORMAT).required(VALIDATION_EMAIL_FORMAT_MESSAGE_REQUIRED ),
  password: Yup.string().min(VALIDATION_PASSWORD_LENGTH, VALIDTION_PASSWORD_MESSAGE_LENGTH ).required(VALIDATION_PASSWORD_MESSAGE_REQUIRED),
  birth: Yup.string()
  .required(VALIDATION_DOB_MESSAGE_REQUIRED)
  .test('dob-valid', VALIDATION_DOB_MESSAGE_PAST, v => {
    if (!v) return false;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    return d < today; 
  }),
});

export const humanizeClerkError = (err: any) => {
  try {
    const json = typeof err === 'string' ? JSON.parse(err) : err;
    const first = json?.errors?.[0];
    return first?.message || 'Something went wrong';
  } catch { return 'Something went wrong'; }
}

export const toast = (msg: string) => {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert(msg);
}

export const startClerkSignUp = async (values: User, isLoaded : boolean, signUp : any, setPendingVerification : React.Dispatch<React.SetStateAction<boolean>>) => {
  if (!isLoaded){
    return;
  }

  try {
    await signUp.create({ emailAddress: values.emailAddress, password: values.password });
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setPendingVerification(true);
  } catch (e: any) {
    Alert.alert('Sign up failed', humanizeClerkError(e));
  }
};

export const completeVerificationAndUpsert = async (values: User, isLoaded : boolean, otpCode : string, signUp : any, setActive :SetActiveFn, upsertUser : any) => {
  if (!isLoaded){
    return;
  }
  try {
    const attempt = await signUp.attemptEmailAddressVerification({ code: otpCode });
  
    if (attempt.status === EMAIL_VERIFICATION_STATUS) {
      await setActive({ session: attempt.createdSessionId });
      
      try {
      await upsertUser.mutateAsync({
        id: attempt.createdUserId,
        email: values.emailAddress,
        firstname: values.firstname,
        lastname: values.lastname,
      });
    } catch (err) {
      console.error("Error connecting to BE", err);
    }
    } else {
      Alert.alert('Verification incomplete', 'Please complete the required steps.');
    }
  } catch (e: any) {
    Alert.alert('Verification failed', humanizeClerkError(e));
  }
};

