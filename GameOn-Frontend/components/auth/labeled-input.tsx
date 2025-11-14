import { Text, TextInput, View, StyleSheet } from "react-native";
import { authStyles } from "@/constants/auth-styles";
import { LabeledInputProps } from "@/components/sign-up/models";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";

export const LabeledInput = ({
  label,
  rightIcon,
  error,
  style,
  ...inputProps
}: Readonly<LabeledInputProps>) => {
  const TextField = isLiquidGlassAvailable() ? GlassView : BlurView;

  return (
    <View style={{ gap: 10 }}>
      <Text style={authStyles.label}>{label}</Text>
      <TextField
        intensity={90}
        tint="dark"
        glassEffectStyle={"clear"}
        tintColor={"rgba(0,0,0,0.5)"}
        style={[
          style,
          styles.TextField,
          isLiquidGlassAvailable() ? null : styles.blur,
          error ? { borderColor: "#EF4444" } : null,
        ]}
      >
        <TextInput
          {...inputProps}
          style={authStyles.input}
          placeholderTextColor="#535252ff"
          selectionColor="white"
        />
        {rightIcon ? (
          <View style={authStyles.rightIcon}>{rightIcon}</View>
        ) : null}
      </TextField>
      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  TextField: {
    width: "100%",
    height: 48,
    borderRadius: 100,
    alignSelf: "center",
    backgroundColor: "rgba(40, 40, 40, 0.08)",
    overflow: "hidden",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  blur: {
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "rgba(191,191,191,0.2)",
    borderWidth: 1,
  },
});
