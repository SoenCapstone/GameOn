import { KeyboardAvoidingView, View } from "react-native";
import { Formik } from "formik";
import { useState } from "react";
import {
  SignUpSchema,
  startClerkSignUp,
  isIOSPadding,
  displayFormikError,
} from "@/components/sign-up/utils";
import { LabeledInput } from "@/components/auth/InputLabel";
import { User, SignUpInputLabel } from "@/components/sign-up/models";
import { VerificationInput } from "@/components/sign-up/VerificationInput";
import { useSignUp } from "@clerk/clerk-expo";
import {
  signUpInputLabels,
  initialSignUpValues,
  EMPTY_STRING,
  SIGN_UP_MESSAGE,
} from "@/components/sign-up/constants";
import { SignUpDatePicker } from "@/components/auth/SignUpDatePicker";
import { SubmitAuthButton } from "@/components/auth/SubmitAuthButton";
import { PasswordVisbilityToggle } from "@/components/auth/PasswordVisibilityToggle";
import { ContentArea } from "@/components/ui/content-area";

export default function SignUpScreen() {
  const [showpassword, setShowpassword] = useState(false);
  const [showDob, setShowDob] = useState(false);

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
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <>
            {pendingVerification ? (
              <VerificationInput
                otpCode={otpCode}
                setOtpCode={setOtpCode}
                setActive={setActive}
                values={values}
                isLoaded={isLoaded}
                signUp={signUp}
                setPendingVerification={setPendingVerification}
              />
            ) : (
              <>
                <View
                  style={{ flex: 1, justifyContent: "space-between", gap: 20 }}
                >
                  <KeyboardAvoidingView behavior={isIOSPadding()}>
                    <View style={{ gap: 20 }}>
                      {signUpInputLabels(showpassword).map(
                        (inputLabel: SignUpInputLabel) => (
                          <LabeledInput
                            key={inputLabel.field}
                            label={inputLabel.label}
                            placeholder={inputLabel.placeholder}
                            value={values?.[inputLabel.field]}
                            onChangeText={handleChange(inputLabel.field)}
                            onBlur={() => handleBlur(inputLabel.field)}
                            keyboardType={inputLabel.keyboardType}
                            autoCapitalize={inputLabel?.autoCapitalize}
                            secureTextEntry={inputLabel.secureTextEntry}
                            rightIcon={
                              inputLabel.rightIcon && (
                                <PasswordVisbilityToggle
                                  showpassword={showpassword}
                                  setShowpassword={setShowpassword}
                                />
                              )
                            }
                            error={displayFormikError(
                              touched,
                              errors,
                              inputLabel,
                            )}
                          />
                        ),
                      )}
                      <SignUpDatePicker
                        setShowDob={setShowDob}
                        showDob={showDob}
                      />
                    </View>
                  </KeyboardAvoidingView>
                </View>

                <SubmitAuthButton actionMessage={SIGN_UP_MESSAGE} />
              </>
            )}
          </>
        )}
      </Formik>
    </ContentArea>
  );
}
