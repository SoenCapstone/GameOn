import { authStyles } from "@/constants/auth-styles";
import React from "react";
import { KeyboardAvoidingView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isIOSPadding } from "@/components/sign-up/utils";
import { DisplayLogo } from "@/components/auth/DisplayLogo";
import { WelcomeLogInButton } from "@/components/auth/WelcomeLogInButton";
import { WelcomeSignUpButton } from "@/components/auth/WelcomeSignUpButton";
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";

export default function WelcomeScreen() {

  return (
    <SafeAreaView style={authStyles.safe}>
      <DisplayLogo
        top={100}
        styleRenderWidth={200}
        styleRenderHeight={200}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={isIOSPadding()}>
        <View style={[authStyles.container, { paddingTop: 300 }]}>
          <Text
              accessibilityRole="header"
              style={{
                alignSelf: "center",
                color: "#fff",
                fontSize: 25,
                fontWeight: "700",
                marginBottom: 100,
              }}
            >
              Welcome to GameOn
          </Text>
          <WelcomeLogInButton/>
          <WelcomeSignUpButton/>
          <PrivacyDisclaimer />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}




