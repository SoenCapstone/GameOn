import { View, Text } from "react-native";
import { Link } from "expo-router";
import { styles } from "@/components/sign-up/styles";

export const AuthSwitchLink: React.FC<{
  text: string;
  path: any;
  authMessage: string;
}> = ({ text, path, authMessage }) => {
  return (
    <View style={{ marginTop: "auto" }}>
      <Text style={styles.metaText}>
        {text}{" "}
        <Link href={path} style={styles.metaLink}>
          {authMessage}
        </Link>
      </Text>
    </View>
  );
};
