import { authStyles } from "@/constants/auth-styles";
import React from "react";
import { View, Text} from "react-native";
import { Link } from "expo-router";
import { WelcomeHero } from "@/components/auth/welcome-hero";
import { PrivacyDisclaimer } from "@/components/privacy-disclaimer/privacy-disclaimer";
import { ContentArea } from "@/components/ui/content-area";
import { WelcomeAuthButton } from "@/components/auth/welcome-auth-button";
import { styles } from "@/components/sign-in/styles";


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

const DevTools = () => {
  return (
    <View>
      <Text style={styles.metaText}>
        open site maps{" "}
        <Link href="/_sitemap" style={styles.metaLink}>
          here
        </Link>
      </Text>
      <Text style={styles.metaText}>
        open home page{" "}
        <Link href="/(tabs)/home" style={styles.metaLink}>
          here
        </Link>
      </Text>
    </View>
  );
};
