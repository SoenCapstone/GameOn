import { authStyles } from "@/constants/auth-styles";
import { KeyboardAvoidingView, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuthHeroLayout } from "@/constants/auth-layout";
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
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";
import {
  signUpInputLabels,
  initialSignUpValues,
  EMPTY_STRING,
  SIGN_UP_MESSAGE,
  SIGN_IN_MESSAGE,
  SIGN_IN_TEXT,
} from "@/components/sign-up/constants";
import { SignUpDatePicker } from "@/components/auth/SignUpDatePicker";
import { SIGN_IN_PATH } from "@/constants/navigation";
import { DisplayLogo } from "@/components/auth/DisplayLogo";
import { SubmitAuthButton } from "@/components/auth/SubmitAuthButton";
import { PasswordVisbilityToggle } from "@/components/auth/PasswordVisibilityToggle";
import { AuthSwitchLink } from "@/components/auth/AuthSwitchLink";
import { AuthLinearGradient } from "@/components/auth/AuthLinearGradient";

const { FORM_PADDING_TOP, TOP_GRADIENT_H, RENDER_W, RENDER_H } =
  getAuthHeroLayout();

export default function SignUpScreen() {
  const [showpassword, setShowpassword] = useState(false);
  const [showDob, setShowDob] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [otpCode, setOtpCode] = useState(EMPTY_STRING);

  return (
    <SafeAreaView style={authStyles.safe}>
      <AuthLinearGradient top={TOP_GRADIENT_H} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={isIOSPadding()}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-start",
            paddingHorizontal: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <DisplayLogo
            top={-55}
            styleRenderWidth={RENDER_W}
            styleRenderHeight={RENDER_H}
          />
          <View
            style={[authStyles.container, { paddingTop: FORM_PADDING_TOP }]}
          >
            <Formik<User>
              initialValues={initialSignUpValues}
              validationSchema={SignUpSchema}
              onSubmit={async (values, { setSubmitting }) => {
                await startClerkSignUp(
                  values,
                  isLoaded,
                  signUp,
                  setPendingVerification
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
                      <View style={{ gap: 16 }}>
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
                                inputLabel
                              )}
                            />
                          )
                        )}
                      </View>

                      <SignUpDatePicker
                        setShowDob={setShowDob}
                        showDob={showDob}
                      />

                      <PrivacyDisclaimer />

                      <SubmitAuthButton actionMessage={SIGN_UP_MESSAGE} />

                      <AuthSwitchLink
                        text={SIGN_IN_TEXT}
                        path={SIGN_IN_PATH}
                        authMessage={SIGN_IN_MESSAGE}
                      />
                    </>
                  )}
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
