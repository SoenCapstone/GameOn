import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { login } from "@/components/sign-in/utils";
import {
  initialSignInValue,
} from "@/components/sign-in/constants";
import { styles } from "@/components/sign-in/styles";

export const DevTools = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  if (!__DEV__) return null;

  const devLogin = async () => {
    if (!signIn || !setActive || !isLoaded) return;

    const email = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL;
    const password = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD;

    if (!email || !password) {
      const msg =
        "Dev login blocked: Missing EXPO_PUBLIC_DEV_LOGIN_EMAIL or EXPO_PUBLIC_DEV_LOGIN_PASSWORD in your .env file.";
      console.warn(msg);
      Alert.alert("Dev Login Error", msg);
      return;
    }
    
    const values = {
      ...initialSignInValue,
      emailAddress: email,
      password: password,
    };

    try {
      await login(values, signIn, setActive, isLoaded);
    } catch (e) {
      console.error("Dev login failed:", e);
    }
  };

  return (
    <View>
      <Text style={styles.metaText}>
        {" "}
        <Pressable onPress={devLogin}>
          <Text style={styles.metaLink}>dev login</Text>
        </Pressable>
      </Text>
    </View>
  );
};

