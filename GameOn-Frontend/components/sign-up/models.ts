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
  keyboardType?: any;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  error?: any;
  style?: StyleProp<ViewStyle>;
};

export type SignUpInputLabel = {
  label: string;
  placeholder: string;
  field: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters" | undefined;
  keyboardType?: any;
  secureTextEntry?: boolean;
  rightIcon?: any;
};

export type SetActiveFn = (params: { session: string }) => Promise<void>;
