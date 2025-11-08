import { StyleSheet, Button, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Background } from "@/components/background";
import ContentArea from "@/components/content-area";
// import { BACKEND_TEST } from "./backendConnectionTest";

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <ContentArea>
      <Background preset="orange" />
      {/* Navigation + Sign out buttons */}
      <View style={styles.stepContainer}>
        <Button
          title="Go to Feature Flags"
          onPress={() => router.push("/flags")}
        />
        {/* Uncomment the component to test backend connection */}
        {/* <BACKEND_TEST /> */}
        <Button
          title="Sign out"
          onPress={async () => {
            await signOut();
          }}
        />
      </View>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
