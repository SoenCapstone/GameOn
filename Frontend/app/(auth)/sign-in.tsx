import { Formik, useFormikContext } from "formik";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { getDevSignInValues, SignInSchema, signin } from "@/utils/sign-in";
import { displayFormikError } from "@/utils/sign-up";
import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle";
import { SignUpInputLabel } from "@/types/auth";
import { LabeledInput } from "@/components/auth/labeled-input";
import { SIGN_IN_MESSAGE } from "@/constants/sign-up";
import { useSignIn } from "@clerk/clerk-expo";
import { ContentArea } from "@/components/ui/content-area";
import { runtime } from "@/utils/runtime";
import { toast } from "@/utils/toast";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  initialSignInValue,
  signInInputLabels,
  FORGOT_PASSWORD_TEXT,
} from "@/constants/sign-in";

function SignInToolbar({
  isSigningIn,
  isDevSigningIn,
  devSignIn,
  onDevSignIn,
}: Readonly<{
  isSigningIn: boolean;
  isDevSigningIn: boolean;
  devSignIn: boolean;
  onDevSignIn: () => void;
}>) {
  const { handleSubmit } = useFormikContext();

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal">
        Welcome
      </Stack.Screen.BackButton>
      <Stack.Screen.Title> Sign In</Stack.Screen.Title>
      <Stack.Toolbar placement="bottom">
        {devSignIn ? (
          isDevSigningIn ? (
            <Stack.Toolbar.View>
              <ActivityIndicator color="white" size="small" />
            </Stack.Toolbar.View>
          ) : (
            <Stack.Toolbar.Button onPress={onDevSignIn} disabled={isSigningIn}>
              Developer Account
            </Stack.Toolbar.Button>
          )
        ) : null}
        <Stack.Toolbar.Spacer />
        {isSigningIn ? (
          <Stack.Toolbar.View>
            <ActivityIndicator color="white" size="small" />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button
            onPress={handleSubmit}
            disabled={isDevSigningIn}
          >
            {SIGN_IN_MESSAGE}
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();
  const showDevSignIn = runtime.isRunningInExpoGo || runtime.isDevelopment;

  const signInMutation = useMutation({
    mutationFn: async (values: typeof initialSignInValue) => {
      if (!setActive) {
        return;
      }
      await signin(values, signIn, setActive, isLoaded);
    },
  });

  const devSignInMutation = useMutation({
    mutationFn: async (values: typeof initialSignInValue) => {
      if (!setActive) {
        return;
      }
      await signin(values, signIn, setActive, isLoaded);
    },
  });

  const handleDevSignIn = () => {
    const devSignInValues = getDevSignInValues();

    if (!devSignInValues) {
      toast.error("Dev Sign In Error", {
        description:
          "Missing EXPO_PUBLIC_DEV_LOGIN_EMAIL or EXPO_PUBLIC_DEV_LOGIN_PASSWORD in your .env file.",
      });
      return;
    }

    devSignInMutation.mutate({
      ...initialSignInValue,
      ...devSignInValues,
    });
  };

  return (
    <Formik
      initialValues={initialSignInValue}
      validationSchema={SignInSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await signInMutation.mutateAsync(values);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleBlur, handleChange, status }) => (
        <ContentArea
          background={{ preset: "red", mode: "form" }}
          toolbar={
            <SignInToolbar
              isSigningIn={signInMutation.isPending}
              isDevSigningIn={devSignInMutation.isPending}
              devSignIn={showDevSignIn}
              onDevSignIn={handleDevSignIn}
            />
          }
          style={{ gap: 20 }}
        >
          {signInInputLabels(showPassword).map(
            (inputLabel: SignUpInputLabel) => (
              <LabeledInput
                key={inputLabel.field}
                label={inputLabel.label}
                placeholder={inputLabel.placeholder}
                value={values?.[inputLabel.field as keyof typeof values]}
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

          <ForgotPassword />

          {displayStatus(status)}
        </ContentArea>
      )}
    </Formik>
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

const styles = StyleSheet.create({
  forgotWrap: {
    alignSelf: "flex-end",
    marginRight: 20,
  },
  forgotText: {
    color: "rgba(235,235,245,0.6)",
    fontSize: 12,
  },
  statusBox: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#7F1D1D",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  statusText: {
    color: "#FCA5A5",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});
