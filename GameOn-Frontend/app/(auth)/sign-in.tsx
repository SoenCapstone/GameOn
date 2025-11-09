import { authStyles } from "@/constants/auth-styles";
import { Link } from "expo-router";
import { Formik } from "formik";
import React, { useState } from "react";
import { KeyboardAvoidingView, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAuthHeroLayout } from "@/constants/auth-layout";
import { SignInSchema, login } from "@/components/sign-in/utils";
import { styles } from "@/components/sign-in/styles";
import {
  initialSignInValue,
  signInInputLabels,
  FORGOT_PASSWORD_TEXT,
  SIGN_UP_TEXT,
} from "@/components/sign-in/constants";
import { isIOSPadding, displayFormikError } from "@/components/sign-up/utils";
import { PasswordVisbilityToggle } from "@/components/auth/PasswordVisibilityToggle";
import { SignUpInputLabel } from "@/components/sign-up/models";
import { LabeledInput } from "@/components/auth/InputLabel";
import { SubmitAuthButton } from "@/components/auth/SubmitAuthButton";
import {
  SIGN_IN_MESSAGE,
  SIGN_UP_MESSAGE,
} from "@/components/sign-up/constants";
import { AuthSwitchLink } from "@/components/auth/AuthSwitchLink";
import { SIGN_UP_PATH } from "@/constants/navigation";
import { AuthLinearGradient } from "@/components/auth/AuthLinearGradient";
import { useSignIn } from "@clerk/clerk-expo";
import { BlurView } from "expo-blur";

const { HERO_TOP, TOP_GRADIENT_H, FORM_PADDING_TOP, RENDER_W, RENDER_H } =
  getAuthHeroLayout();

export default function SignInScreen() {
  const [showpassword, setShowpassword] = useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();

  return (
    <SafeAreaView style={authStyles.safe}>
      <AuthLinearGradient top={TOP_GRADIENT_H} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={isIOSPadding()}>
        <View style={[authStyles.container, { paddingTop: FORM_PADDING_TOP }]}>
          <Text
              accessibilityRole="header"
              style={{
                alignSelf: "center",
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
                marginBottom: 6,
              }}
            >
              Login
          </Text>
          <Formik
            initialValues={initialSignInValue}
            validationSchema={SignInSchema}
            onSubmit={async (values) =>
              await login(values, signIn, setActive, isLoaded)
            }
          >
            {({
              values,
              errors,
              touched,
              handleBlur,
              handleChange,
              status,
            }) => (
              <>
                <View style={{ gap: 16 }}>
                  {signInInputLabels(showpassword).map(
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
                        error={displayFormikError(touched, errors, inputLabel)}
                      />
                    )
                  )}

                  <ForgotPassword />
                </View>

                {displayStatus(status)}

                <SubmitAuthButton actionMessage={SIGN_IN_MESSAGE} />

                <AuthSwitchLink
                  text={SIGN_UP_TEXT}
                  path={SIGN_UP_PATH}
                  authMessage={SIGN_UP_MESSAGE}
                />

              </>
            )}
          </Formik>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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


