import { Text, TextInput, View, StyleSheet } from "react-native";
import { LabeledInputProps } from "@/types/auth";
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
      <Text style={styles.label}>{label}</Text>
      <TextField
        intensity={90}
        tint="dark"
        glassEffectStyle={"clear"}
        tintColor={"rgba(0,0,0,0.5)"}
        style={[
          style,
          styles.field,
          isLiquidGlassAvailable() ? null : styles.blur,
          error ? { borderColor: "#EF4444" } : null,
        ]}
      >
        <TextInput
          {...inputProps}
          style={styles.input}
          placeholderTextColor="#535252ff"
          selectionColor="white"
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </TextField>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginLeft: 16,
    color: "rgba(235,235,245,0.6)",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },
  field: {
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
  input: {
    flex: 1,
    fontSize: 17,
    color: "#bab8b8ff",
  },
  icon: {
    marginLeft: 8,
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 16,
  },
  blur: {
    overflow: "hidden",
    borderStyle: "solid",
    borderColor: "rgba(191,191,191,0.2)",
    borderWidth: 1,
  },
});
