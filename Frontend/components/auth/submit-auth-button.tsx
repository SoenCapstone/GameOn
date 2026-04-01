import { useFormikContext } from "formik";
import { User } from "@/types/auth";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

type SubmitAuthButtonProps = Readonly<{
  actionMessage: string;
}>;

export function SubmitAuthButton({ actionMessage }: SubmitAuthButtonProps) {
  const { handleSubmit, isSubmitting } = useFormikContext<User>();
  const Button = isLiquidGlassAvailable() ? GlassView : BlurView;

  return (
    <Button
      isInteractive={true}
      glassEffectStyle={"clear"}
      tintColor={"rgba(0,0,0,0.5)"}
      tint="dark"
      style={[styles.button, isLiquidGlassAvailable() ? null : styles.blur]}
    >
      <Pressable
        onPress={() => handleSubmit()}
        disabled={isSubmitting}
        style={styles.pressable}
      >
        {displayButtonOrLoader(actionMessage, isSubmitting)}
      </Pressable>
    </Button>
  );
}

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
  button: {
    width: 250,
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
  pressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#BFBFBF",
    fontSize: 17,
    alignSelf: "center",
    fontWeight: "500",
  },
});
