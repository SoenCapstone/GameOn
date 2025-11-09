import { ActivityIndicator, Text, Pressable, StyleSheet } from "react-native";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import { styles } from "@/components/sign-in/styles";
import { BlurView } from "expo-blur";


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
    <BlurView
      intensity={90}
      tint="dark"
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(40, 40, 40, 0.08)", }]}
    />
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
