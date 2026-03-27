import { authStyles } from "@/constants/auth-styles";
import { StyleSheet, View } from "react-native";
import { WelcomeHero } from "@/components/auth/welcome-hero";
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";
import { WelcomeAuthButton } from "@/components/auth/welcome-auth-button";
import { DevTools } from "@/components/auth/dev-login";
import { runtime } from "@/utils/runtime";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <WelcomeHero top={144} styleRenderWidth={200} styleRenderHeight={200} />
      <View style={authStyles.container}>
        <WelcomeAuthButton route={"/(auth)/sign-in"} label={"Sign In"} />
        <WelcomeAuthButton route="/(auth)/sign-up" label={"Create Account"} />
        {(runtime.isRunningInExpoGo || runtime.isDevelopment) && <DevTools />}
        <PrivacyDisclaimer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
});
