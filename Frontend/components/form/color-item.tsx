import { Text, StyleSheet, TextInput, TextInputProps } from "react-native";
import { ColorPicker, ColorPickerProps, Host } from "@expo/ui/swift-ui";
import { isRunningInExpoGo } from "@/utils/runtime";
import { BlurView } from "expo-blur";

interface ColorItemPickerProps extends ColorPickerProps {
  readonly label: string;
}

interface ColorItemInputProps extends TextInputProps {
  readonly label: string;
}

type ColorItemProps = ColorItemPickerProps | ColorItemInputProps;

export function ColorItem({ label, ...props }: Readonly<ColorItemProps>) {
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      {isRunningInExpoGo ? (
        <TextInput
          {...(props as TextInputProps)}
          style={styles.input}
          placeholder="#FF0000"
        />
      ) : (
        <Host matchContents>
          <ColorPicker
            {...(props as ColorPickerProps)}
            supportsOpacity={false}
          />
        </Host>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 52,
    borderRadius: 100,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#AFAFB6",
    fontSize: 17,
    paddingLeft: 10,
    textAlign: "right",
    textAlignVertical: "center",
  },
});
