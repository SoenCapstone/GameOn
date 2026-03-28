import { StyleSheet, View } from "react-native";
import { WelcomeHero } from "@/components/auth/welcome-hero";
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";
import { WelcomeAuthButton } from "@/components/auth/welcome-auth-button";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <WelcomeHero top={144} styleRenderWidth={200} styleRenderHeight={200} />
      <View style={styles.content}>
        <View style={styles.buttons}>
          <WelcomeAuthButton route="/(auth)/sign-in" label="Sign In" />
          <WelcomeAuthButton route="/(auth)/sign-up" label="Create Account" />
        </View>
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
  content: {
    gap: 20,
  },
  buttons: {
    gap: 16,
  },
});
