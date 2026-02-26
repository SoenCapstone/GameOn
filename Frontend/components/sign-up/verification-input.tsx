import {
  Text,
  View,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useClerk } from "@clerk/clerk-expo";
import { styles } from "@/components/sign-up/styles";
import { completeVerificationAndUpsert } from "@/components/sign-up/utils";
import { useUpsertUser } from "@/components/sign-up/hooks/use-insert-clerk-to-be";
import {
  User,
  SetActiveFn,
  SignUpResourceType,
} from "@/components/sign-up/models";
import { LabeledInput } from "@/components/auth/labeled-input";
import { WelcomeAuthButton } from "@/components/auth/welcome-auth-button";

type VerificationInputProps = {
  otpCode: string;
  setOtpCode: React.Dispatch<React.SetStateAction<string>>;
  setActive: SetActiveFn;
  values: User;
  isLoaded: boolean;
  signUp: SignUpResourceType | undefined;
};

export const VerificationInput: React.FC<VerificationInputProps> = ({
  otpCode,
  setOtpCode,
  setActive,
  values,
  isLoaded,
  signUp,
}) => {
  const upsertUser = useUpsertUser();
  const clerk = useClerk();

  const deleteUserOnError = async (): Promise<void> => {
    await clerk.user?.delete();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, justifyContent: "space-between" }}>
        <LabeledInput
          label="Verification Code"
          placeholder="123456"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="numeric"
        />
        <WelcomeAuthButton
          label={
            upsertUser.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.ctaText}>Verify Email</Text>
            )
          }
          onPress={async () =>
            completeVerificationAndUpsert(
              values,
              isLoaded,
              otpCode,
              signUp,
              setActive,
              upsertUser,
              deleteUserOnError,
            )
          }
        />
      </View>
    </TouchableWithoutFeedback>
  );
};
