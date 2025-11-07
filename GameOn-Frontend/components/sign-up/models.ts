import React from "react";

export type User = { firstname: string; lastname: string; birth: string; emailAddress: string; password: string };

export type UserSignIn = {emailAddress: string; password: string}

export type LabeledInputProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  onBlur?: () => void;
  keyboardType?: any;
  autoCapitalize?: string | undefined;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  error?: any
};

export type SignUpInputLabel = {
  label: string;
  placeholder: string;
  field: string;
  autoCapitalize?: undefined | string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  rightIcon?: any;
};

export type SetActiveFn = (params: { session: string }) => Promise<void>;
