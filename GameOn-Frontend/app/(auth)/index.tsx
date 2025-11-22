import { authStyles } from "@/constants/auth-styles";
import React from "react";
import { View} from "react-native";
import { WelcomeHero } from "@/components/auth/welcome-hero";
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";
import { ContentArea } from "@/components/ui/content-area";
import { WelcomeAuthButton } from "@/components/auth/welcome-auth-button";
import { DevTools } from "@/components/auth/dev-login";


export default function WelcomeScreen() {
  return (
    <ContentArea style={{ justifyContent: "space-between", paddingBottom: 50 }}>
      <WelcomeHero top={144} styleRenderWidth={200} styleRenderHeight={200} />
      <View style={authStyles.container}>
        <WelcomeAuthButton
          route={"/(auth)/sign-in"}
          label={"Sign In"}
        />
        <WelcomeAuthButton
          route="/(auth)/sign-up"
          label={"Create Account"}
        />
        {__DEV__ && <DevTools />}
        <PrivacyDisclaimer />
      </View>
    </ContentArea>
  );
}