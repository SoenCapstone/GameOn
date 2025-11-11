import { authStyles } from "@/constants/auth-styles";
import React from "react";
import { View } from "react-native";
import { WelcomeHero } from "@/components/auth/welcome-hero";
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";
import { ContentArea } from "@/components/ui/content-area";
import { WelcomeAuthButton } from "@/components/auth/WelcomeAuthButton";

export default function WelcomeScreen() {
  return (
    <ContentArea style={{ justifyContent: "space-between", paddingBottom: 50 }}>
      <WelcomeHero top={144} styleRenderWidth={200} styleRenderHeight={200} />
      <View style={authStyles.container}>
        <WelcomeAuthButton
          route={"/(auth)/boarding/sign-in"}
          label={"Sign In"}
        />
        <WelcomeAuthButton
          route="/(auth)/boarding/sign-up"
          label={"Create Account"}
        />
        <PrivacyDisclaimer />
      </View>
    </ContentArea>
  );
}
