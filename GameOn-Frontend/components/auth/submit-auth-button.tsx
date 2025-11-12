import { ActivityIndicator, Text, Pressable, StyleSheet } from "react-native";
import { useFormikContext } from "formik";
import { User } from "@/components/sign-up/models";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

export const SubmitAuthButton: React.FC<{ actionMessage: string }> = ({
  actionMessage,
}) => {
  const { handleSubmit, isSubmitting } = useFormikContext<User>();
  const Button = isLiquidGlassAvailable() ? GlassView : BlurView;

  return (
    <Pressable
      onPress={() => handleSubmit()}
      disabled={isSubmitting}
      style={styles.pressable}
    >
      <Button
        isInteractive={true}
        tint="dark"
        style={[styles.button, isLiquidGlassAvailable() ? null : styles.blur]}
      >
        {displayButtonOrLoader(actionMessage, isSubmitting)}
      </Button>
    </Pressable>
  );
};

const displayLoader = () => {
  return <ActivityIndicator />;
};

const displayButton = (actionMessage: string) => {
  return <Text style={styles.text}>{actionMessage}</Text>;
};

const displayButtonOrLoader = (
  actionMessage: string,
  isSubmitting: boolean,
) => {
  if (isSubmitting) {
    return displayLoader();
  }
  return displayButton(actionMessage);
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 100,
    alignSelf: "center",
    justifyContent: "center",
  },
  blur: {
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "rgba(191,191,191,0.2)",
    borderWidth: 1,
  },
  text: {
    color: "#BFBFBF",
    fontSize: 17,
    alignSelf: "center",
    fontWeight: "500",
  },
});
