import { Text, View, StyleSheet } from "react-native";
import { openPolicy } from "@/components/privacy-disclaimer/utils";
import { POLICY_DISCLAIMER_MESSAGE } from "@/components/privacy-disclaimer/constants";

export const PrivacyDisclaimer = () => {
  return (
    <View style={styles.disclaimerWrap}>
      <Text style={styles.disclaimer}>
        {POLICY_DISCLAIMER_MESSAGE[0]}{" "}
        <Text
          style={styles.disclaimerEmph}
          onPress={openPolicy}
          accessibilityRole="link"
        >
          {POLICY_DISCLAIMER_MESSAGE[1]}
        </Text>{" "}
        {POLICY_DISCLAIMER_MESSAGE[2]}{" "}
        <Text
          style={styles.disclaimerEmph}
          onPress={openPolicy}
          accessibilityRole="link"
        >
          {POLICY_DISCLAIMER_MESSAGE[3]}
        </Text>
        .
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  disclaimerWrap: {
    alignItems: "center",
  },
  disclaimer: {
    color: "#8C8C8C",
    fontSize: 13,
    lineHeight: 18,
  },
  disclaimerEmph: {
    color: "#D9D9D9",
  },
});
