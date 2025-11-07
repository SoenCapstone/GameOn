import {
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { authStyles } from "@/constants/auth-styles";
import { styles } from "@/components/sign-up/styles";
import { completeVerificationAndUpsert } from "@/components/sign-up/utils";
import { useUpsertUser } from "@/components/sign-up/hooks/useInsertClerkToBe";
import { User, SetActiveFn } from "@/components/sign-up/models";

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
      <View style={{ gap: 16, paddingTop: 200, paddingHorizontal: 20 }}>
        <Text style={authStyles.label}>Verify your email</Text>
        <View style={authStyles.inputWrap}>
          <TextInput
            placeholder="Enter verification code"
            value={otpCode}
            onChangeText={setOtpCode}
            style={authStyles.input}
            placeholderTextColor="#FFFFFF"
            autoCapitalize="none"
          />
        </View>
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
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          {upsertUser.isPending ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.ctaText}>Continue</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          onPress={() => setPendingVerification(false)}
        >
          <Text style={styles.ctaText}>Go back</Text>
        </Pressable>
      </View>
    </>
  );
};
