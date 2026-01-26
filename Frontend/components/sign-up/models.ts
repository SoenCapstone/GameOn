import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import type { FormikErrors } from "formik";

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
  keyboardType?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  error?: string | FormikErrors<User> | string[] | FormikErrors<User>[];
  style?: StyleProp<ViewStyle>;
};

export type SignUpInputLabel = {
  label: string;
  placeholder: string;
  field: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: string;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
};

export type SetActiveFn = (params: { session: string }) => Promise<void>;
