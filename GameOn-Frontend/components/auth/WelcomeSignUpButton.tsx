import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { WelcomeAuthButton } from "./WelcomeAuthButton";

export const WelcomeSignUpButton: React.FC<{
  label?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ label = "Sign up", style }) => (
  <WelcomeAuthButton route="/(auth)/sign-up" label={label} style={style} />
);

