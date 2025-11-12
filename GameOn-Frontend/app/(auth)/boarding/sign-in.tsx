import { Link } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SignInSchema, login } from "@/components/sign-in/utils";
import { styles } from "@/components/sign-in/styles";
import {
  initialSignInValue,
  signInInputLabels,
  FORGOT_PASSWORD_TEXT,
} from "@/components/sign-in/constants";
import { isIOSPadding, displayFormikError } from "@/components/sign-up/utils";
import { PasswordVisbilityToggle } from "@/components/auth/password-visibility-toggle";
import { SignUpInputLabel } from "@/components/sign-up/models";
import { LabeledInput } from "@/components/auth/input-label";
import { SubmitAuthButton } from "@/components/auth/submit-auth-button";
import { SIGN_IN_MESSAGE } from "@/components/sign-up/constants";
import { useSignIn } from "@clerk/clerk-expo";
import { ContentArea } from "@/components/ui/content-area";

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();

  return (
    <ContentArea auth backgroundProps={{ preset: "red", mode: "form" }}>
      <Formik
        initialValues={initialSignInValue}
        validationSchema={SignInSchema}
        onSubmit={async (values) => {
          if (!setActive) return;
          await login(values, signIn, setActive, isLoaded);
        }}
      >
        {({ values, errors, touched, handleBlur, handleChange, status }) => (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              <View style={{ gap: 16 }}>
                <KeyboardAvoidingView behavior={isIOSPadding()}>
                  <View style={{ gap: 20 }}>
                    {signInInputLabels(showPassword).map(
                      (inputLabel: SignUpInputLabel) => (
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
                              <PasswordVisbilityToggle
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
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
                  </View>
                </KeyboardAvoidingView>

                <ForgotPassword />
              </View>

              {displayStatus(status)}
              <View style={{ gap: 14 }}>
                {__DEV__ && <DevTools />}

                <SubmitAuthButton actionMessage={SIGN_IN_MESSAGE} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
      </Formik>
    </ContentArea>
  );
}

const ForgotPassword = () => {
  return (
    <Pressable onPress={() => {}} style={styles.forgotWrap}>
      <Text style={styles.forgotText}>{FORGOT_PASSWORD_TEXT}</Text>
    </Pressable>
  );
};

const displayStatus = (status: string) => {
  return status ? (
    <View style={styles.statusBox}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  ) : null;
};

const DevTools = () => {
  return (
    <View>
      <Text style={styles.metaText}>
        enter app{" "}
        <Link href="/(tabs)/profile" style={styles.metaLink}>
          here
        </Link>{" "}
        open site maps{" "}
        <Link href="/_sitemap" style={styles.metaLink}>
          here
        </Link>
      </Text>
    </View>
  );
};
