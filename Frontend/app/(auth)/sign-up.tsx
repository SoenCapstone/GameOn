import { View, Keyboard, TouchableWithoutFeedback } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Formik } from "formik";
import { useState } from "react";
import {
  SignUpSchema,
  startClerkSignUp,
  displayFormikError,
} from "@/components/sign-up/utils";
import { LabeledInput } from "@/components/auth/labeled-input";
import { User } from "@/components/sign-up/models";
import { VerificationInput } from "@/components/sign-up/verification-input";
import { useSignUp } from "@clerk/clerk-expo";
import {
  signUpInputLabels,
  initialSignUpValues,
  EMPTY_STRING,
  SIGN_UP_MESSAGE,
} from "@/components/sign-up/constants";
import { SignUpDatePicker } from "@/components/auth/sign-up-date-picker";
import { SubmitAuthButton } from "@/components/auth/submit-auth-button";
import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle";
import { ContentArea } from "@/components/ui/content-area";

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [otpCode, setOtpCode] = useState(EMPTY_STRING);

  return (
    <ContentArea auth backgroundProps={{ preset: "red", mode: "form" }}>
      <Formik<User>
        initialValues={initialSignUpValues}
        validationSchema={SignUpSchema}
        onSubmit={async (values, { setSubmitting }) => {
          await startClerkSignUp(
            values,
            isLoaded,
            signUp,
            setPendingVerification,
          );
          setSubmitting(false);
        }}
      >
        {({ values, errors, touched, handleChange, handleBlur }) =>
          pendingVerification && setActive ? (
            <VerificationInput
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              setActive={setActive}
              values={values}
              isLoaded={isLoaded}
              signUp={signUp}
            />
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <KeyboardAwareScrollView
                  style={{ flex: 1, overflow: "visible" }}
                  contentContainerStyle={{ gap: 20, overflow: "visible" }}
                  bottomOffset={30}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ gap: 20 }}>
                    {signUpInputLabels(showPassword).map((inputLabel) => (
                      <LabeledInput
                        key={inputLabel.field}
                        label={inputLabel.label}
                        placeholder={inputLabel.placeholder}
                        value={
                          values?.[inputLabel.field as keyof typeof values]
                        }
                        onChangeText={handleChange(inputLabel.field)}
                        onBlur={() => handleBlur(inputLabel.field)}
                        keyboardType={inputLabel.keyboardType}
                        autoCapitalize={inputLabel?.autoCapitalize}
                        secureTextEntry={inputLabel.secureTextEntry}
                        rightIcon={
                          inputLabel.rightIcon && (
                            <PasswordVisibilityToggle
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                            />
                          )
                        }
                        error={displayFormikError(touched, errors, inputLabel)}
                      />
                    ))}
                    <SignUpDatePicker />
                  </View>
                </KeyboardAwareScrollView>
                <SubmitAuthButton actionMessage={SIGN_UP_MESSAGE} />
              </View>
            </TouchableWithoutFeedback>
          )
        }
      </Formik>
    </ContentArea>
  );
}
