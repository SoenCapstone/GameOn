import { Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import DateTimePicker, {
  AndroidNativeProps,
  IOSNativeProps,
} from "@react-native-community/datetimepicker";
import { useAccentColor } from "@/contexts/accent-color-context";

type DateTimePickerProps = IOSNativeProps | AndroidNativeProps;

type DateTimeItemProps = DateTimePickerProps & {
  readonly label: string;
};

export function DateTimeItem({
  label,
  ...pickerProps
}: Readonly<DateTimeItemProps>) {
  const contextAccentColor = useAccentColor();
  const accentColor =
    "accentColor" in pickerProps ? pickerProps.accentColor : undefined;
  const pickerAccentColor = accentColor ?? contextAccentColor;

  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <DateTimePicker
        {...pickerProps}
        accentColor={pickerAccentColor}
      />
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
    paddingRight: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "white",
    fontSize: 17,
    lineHeight: 22,
  },
});
