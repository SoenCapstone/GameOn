import { useState } from "react";
import { Stack } from "expo-router";
import { Formik, useFormikContext } from "formik";
import { ActivityIndicator } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { LabeledInput } from "@/components/auth/labeled-input";
import { useClerk, useSignUp } from "@clerk/clerk-expo";
import { SignUpDatePicker } from "@/components/auth/sign-up-date-picker";
import { PasswordVisibilityToggle } from "@/components/auth/password-visibility-toggle";
import { ContentArea } from "@/components/ui/content-area";
import { useUpsertUser } from "@/hooks/use-upsert-user";
import { User } from "@/types/auth";
import {
  completeVerificationAndUpsert,
  SignUpSchema,
  startClerkSignUp,
  displayFormikError,
} from "@/utils/sign-up";
import {
  signUpInputLabels,
  initialSignUpValues,
  EMPTY_STRING,
  SIGN_UP_MESSAGE,
} from "@/constants/sign-up";

function SignUpToolbar({
  pendingVerification,
  onVerify,
  isCreating,
  isVerifying,
}: Readonly<{
  pendingVerification: boolean;
  onVerify: () => void;
  isCreating: boolean;
  isVerifying: boolean;
}>) {
  const { handleSubmit } = useFormikContext();
  const isLoading = pendingVerification ? isVerifying : isCreating;
  const label = pendingVerification ? "Verify Email" : SIGN_UP_MESSAGE;
  const onPress = pendingVerification ? onVerify : handleSubmit;

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal">
        Welcome
      </Stack.Screen.BackButton>
      <Stack.Screen.Title> Sign Up</Stack.Screen.Title>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Spacer />
        {isLoading ? (
          <Stack.Toolbar.View>
            <ActivityIndicator color="white" size="small" />
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button onPress={onPress}>{label}</Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>
    </>
  );
}

export default function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const clerk = useClerk();
  const upsertUser = useUpsertUser();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationValues, setVerificationValues] = useState<User | null>(
    null,
  );
  const [otpCode, setOtpCode] = useState(EMPTY_STRING);

  const deleteUserOnError = async (): Promise<void> => {
    await clerk.user?.delete();
  };

  const signUpMutation = useMutation({
    mutationFn: async (values: User) => {
      const started = await startClerkSignUp(values, isLoaded, signUp);
      return { started, values };
    },
    onSuccess: ({ started, values }) => {
      if (!started) {
        return;
      }

      setVerificationValues(values);
      setPendingVerification(true);
      setOtpCode(EMPTY_STRING);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!setActive || !verificationValues) {
        return;
      }

      await completeVerificationAndUpsert(
        verificationValues,
        isLoaded,
        otpCode,
        signUp,
        setActive,
        upsertUser,
        deleteUserOnError,
      );
    },
  });

  return (
    <Formik<User>
      initialValues={initialSignUpValues}
      validationSchema={SignUpSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await signUpMutation.mutateAsync(values);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur }) => {
        const handleVerify = () => {
          verifyMutation.mutate();
        };

        return (
          <ContentArea
            background={{ preset: "red", mode: "form" }}
            toolbar={
              <SignUpToolbar
                pendingVerification={pendingVerification}
                onVerify={handleVerify}
                isCreating={signUpMutation.isPending}
                isVerifying={verifyMutation.isPending}
              />
            }
            style={{ gap: 20 }}
          >
            {pendingVerification ? (
              <LabeledInput
                label="Verification Code"
                placeholder="123456"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
              />
            ) : (
              <>
                {signUpInputLabels(showPassword).map((inputLabel) => (
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
                ))}
                <SignUpDatePicker />
              </>
            )}
          </ContentArea>
        );
      }}
    </Formik>
  );
}
