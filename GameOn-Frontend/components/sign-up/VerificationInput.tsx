import {
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { authStyles } from "@/constants/auth-styles";
import { styles } from "@/components/sign-up/styles";
import { completeVerificationAndUpsert } from "@/components/sign-up/utils";
import { useUpsertUser } from "@/components/sign-up/hooks/useInsertClerkToBe";
import { User, SetActiveFn } from "@/components/sign-up/models";
import { BlurView } from "expo-blur";

export const VerificationInput: React.FC<{
  otpCode: string;
  setOtpCode: React.Dispatch<React.SetStateAction<string>>;
  setActive: SetActiveFn | undefined;
  values: User;
  isLoaded: boolean;
  signUp: any;
  setPendingVerification: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  otpCode,
  setOtpCode,
  setActive,
  values,
  isLoaded,
  signUp,
  setPendingVerification,
}) => {
  const upsertUser = useUpsertUser();
  return (
    <>
      <View style={{ gap: 16, paddingTop: 50, paddingHorizontal: 20 }}>
        <Text style={authStyles.label}>Verify your email</Text>
        <BlurView intensity={90} tint="dark" style={glass.card}>
        <View style={glass.pad}>
          <TextInput
            placeholder="Enter verification code"
            value={otpCode}
            onChangeText={setOtpCode}
            style={[authStyles.input, { backgroundColor: "transparent" }]}
            placeholderTextColor="#9aa0a6"
            autoCapitalize="none"
          />
        </View>
      </BlurView>

        <Pressable
          onPress={async () =>
            completeVerificationAndUpsert(
              values,
              isLoaded,
              otpCode,
              signUp,
              setActive,
              upsertUser
            )
          }
          style={({ pressed }) => [styles.cta, glass.buttonBase, pressed && { opacity: 0.85 }]}
        >
          <BlurView
            intensity={90}
            tint="dark"
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(40, 40, 40, 0.08)", }]}
          />
          {upsertUser.isPending ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.ctaText}>Continue</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cta, glass.buttonBase, pressed && { opacity: 0.85 }]}
          onPress={() => setPendingVerification(false)}
        >
          <BlurView
            intensity={90}
            tint="dark"
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(40, 40, 40, 0.08)", }]}
          />
          <Text style={styles.ctaText}>Go back</Text>
        </Pressable>
      </View>
    </>
  );
};

const glass = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  pad: { paddingHorizontal: 16, paddingVertical: 12 },

  // ⬇️ add these
  buttonBase: {
    height: 52,
    borderRadius: 999,        // pill shape like your input
    overflow: "hidden",       // clip the Blur to the radius
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,        // match the parent radius
  },
});

