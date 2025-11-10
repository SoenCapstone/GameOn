import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import { WelcomeAuthButton } from "./WelcomeAuthButton";

export const WelcomeLogInButton: React.FC<{
  label?: string;
  style?: StyleProp<ViewStyle>;
}> = ({ label = "Login", style }) => (
  <WelcomeAuthButton route="/(auth)/sign-in" label={label} style={style} />
);
