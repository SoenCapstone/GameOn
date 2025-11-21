import { Link } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import {
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
import { displayFormikError } from "@/components/sign-up/utils";
import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle";
import { SignUpInputLabel } from "@/components/sign-up/models";
import { LabeledInput } from "@/components/auth/labeled-input";
import { SubmitAuthButton } from "@/components/auth/submit-auth-button";
import { SIGN_IN_MESSAGE } from "@/components/sign-up/constants";
import { useSignIn } from "@clerk/clerk-expo";
import { ContentArea } from "@/components/ui/content-area";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

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
              <KeyboardAwareScrollView
                style={{ flex: 1, overflow: "visible" }}
                contentContainerStyle={{ gap: 16, overflow: "visible" }}
                bottomOffset={30}
                showsVerticalScrollIndicator={false}
              >
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
                            <PasswordVisibilityToggle
                              showPassword={showPassword}
                              setShowPassword={setShowPassword}
                            />
                          )
                        }
                        error={displayFormikError(touched, errors, inputLabel)}
                      />
                    ),
                  )}
                </View>

                <ForgotPassword />
              </KeyboardAwareScrollView>

              {displayStatus(status)}
              <View style={{ gap: 14 }}>
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
