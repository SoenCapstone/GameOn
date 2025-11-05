import React from "react";
import { StyleSheet, Button, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth";
import { ContentArea } from "@/components/ui/content-area";

export default function Profile() {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <ContentArea backgroundProps={{ preset: "orange" }}>
      {/* Navigation + Sign out buttons */}
      <View style={styles.stepContainer}>
        <Button
          title="Go to Feature Flags"
          onPress={() => router.push("/flags")}
        />
        <Button title="Sign out" onPress={signOut} />
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
