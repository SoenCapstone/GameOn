import React from "react";
import { StyleProp, ViewStyle } from "react-native";

export type User = {
  firstname: string;
  lastname: string;
  birth: string;
  emailAddress: string;
  password: string;
};

export type UserSignIn = { emailAddress: string; password: string };

export type LabeledInputProps = {
  label: string;
  placeholder?: string;
  value?: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  error?: string;
  style?: StyleProp<ViewStyle>;
};

export type SignUpInputLabel = {
  label: string;
  placeholder: string;
  field: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "number-pad" | "decimal-pad";
  secureTextEntry?: boolean;
  rightIcon?: boolean;
};

export type UpsertUserMutation = {
  mutateAsync: (payload: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
  }) => Promise<void>;
  isPending?: boolean;
};
