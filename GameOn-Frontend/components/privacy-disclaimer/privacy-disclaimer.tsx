import { Text, View } from "react-native";
import { styles } from "../sign-up/styles";
import { openPolicy } from "./utils";
import { POLICY_DISCLAIMER_MESSAGE } from "./constants";

export const PrivacyDisclaimer = () => {
  return (
    <View style={styles.disclaimerWrap}>
      <Text style={styles.disclaimer}>
        {POLICY_DISCLAIMER_MESSAGE[0]}
        {"\n"}
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
