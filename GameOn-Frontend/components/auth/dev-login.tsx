import React from "react";
import { View, Text, Pressable } from "react-native";
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

    const values = {
        ...initialSignInValue,
        emailAddress: process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || "",
        password: process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD || "",
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

