import { ActivityIndicator, Text, Pressable } from "react-native";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import { styles } from "@/components/sign-in/styles";

export const SubmitAuthButton: React.FC<{ actionMessage: string }> = ({
  actionMessage,
}) => {
  const { handleSubmit, isSubmitting } = useFormikContext<User>();
  return (
    <Pressable
      onPress={() => handleSubmit()}
      disabled={isSubmitting}
      style={({ pressed }) => [
        styles.cta,
        (pressed || isSubmitting) && { opacity: 0.85 },
        isSubmitting && { opacity: 0.6 },
      ]}
    >
      {displayButtonOrLoader(actionMessage, isSubmitting)}
    </Pressable>
  );
};

const displayButtonOrLoader = (
  actionMessage: string,
  isSubmitting: boolean
) => {
  return isSubmitting ? (
    <ActivityIndicator />
  ) : (
    <Text style={styles.ctaText}>{actionMessage}</Text>
  );
};
