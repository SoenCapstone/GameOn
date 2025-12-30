import { useRef } from "react";
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  findNodeHandle,
} from "react-native";
import { Host, Picker } from "@expo/ui/swift-ui";
import { fixedSize } from "@expo/ui/swift-ui/modifiers";
import { isRunningInExpoGo } from "@/utils/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";

interface MenuPickerProps {
  readonly options: readonly string[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}

export function MenuPicker({
  options,
  value,
  onValueChange,
}: Readonly<MenuPickerProps>) {
  const anchorRef = useRef<View>(null);
  const { showActionSheetWithOptions } = useActionSheet();

  const onPress = () => {
    showActionSheetWithOptions(
      {
        options: [...options],
        anchor: findNodeHandle(anchorRef.current) ?? undefined,
      },
      (buttonIndex) => {
        if (buttonIndex !== undefined && buttonIndex !== options.length) {
          onValueChange(options[buttonIndex]);
        }
      },
    );
  };

  if (isRunningInExpoGo) {
    return (
      <Pressable ref={anchorRef} style={styles.button} onPress={onPress}>
        {({ pressed }) => (
          <>
            <Text
              style={[
                styles.value,
                pressed && { color: "rgba(235,235,245,0.7)" },
              ]}
            >
              {value}
            </Text>
            <Ionicons
              name="chevron-expand"
              size={16}
              color={
                pressed ? "rgba(235,235,245,0.7)" : "rgba(235,235,245,0.6)"
              }
            />
          </>
        )}
      </Pressable>
    );
  }

  return (
    <View>
      <Host matchContents>
        <Picker
          modifiers={[fixedSize({ horizontal: true, vertical: true })]}
          options={[...options]}
          selectedIndex={options.indexOf(value)}
          onOptionSelected={(event) =>
            onValueChange(options[event.nativeEvent.index])
          }
          variant="menu"
          color="rgba(235,235,245,0.6)"
        />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  value: {
    color: "rgba(235,235,245,0.6)",
    fontSize: 17,
    lineHeight: 22,
  },
});
