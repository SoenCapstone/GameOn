import { useRef } from "react";
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  findNodeHandle,
} from "react-native";
import { Host, Picker } from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  fixedSize,
  opacity,
} from "@expo/ui/swift-ui/modifiers";
import { isRunningInExpoGo } from "@/utils/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";

interface MenuPickerProps {
  readonly title?: string;
  readonly options: readonly string[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
}

export function MenuPicker({
  title,
  options,
  value,
  onValueChange,
  disabled = false,
}: Readonly<MenuPickerProps>) {
  const anchorRef = useRef<View>(null);
  const { showActionSheetWithOptions } = useActionSheet();

  const onPress = () => {
    if (disabled) return;

    showActionSheetWithOptions(
      {
        title: title,
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
      <Pressable
        ref={anchorRef}
        style={styles.button}
        onPress={onPress}
        disabled={disabled}
      >
        {({ pressed }) => {
          let iconColor: string;
          if (disabled) {
            iconColor = "rgba(235,235,245,0.35)";
          } else if (pressed) {
            iconColor = "rgba(235,235,245,0.7)";
          } else {
            iconColor = "rgba(235,235,245,0.6)";
          }

          return (
            <>
              <Text
                style={[
                  styles.value,
                  disabled && styles.valueDisabled,
                  pressed && { color: "rgba(235,235,245,0.7)" },
                ]}
              >
                {value}
              </Text>
              <Ionicons name="chevron-expand" size={16} color={iconColor} />
            </>
          );
        }}
      </Pressable>
    );
  }

  return (
    <View>
      <Host matchContents>
        <Picker
          modifiers={[
            fixedSize({ horizontal: true, vertical: true }),
            disabledModifier(disabled),
            opacity(disabled ? 0.5 : 1),
          ]}
          options={[...options]}
          selectedIndex={options.indexOf(value)}
          onOptionSelected={(event) =>
            onValueChange(options[event.nativeEvent.index])
          }
          variant="menu"
          color={disabled ? "rgba(235,235,245,0.35)" : "rgba(235,235,245,0.6)"}
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
  valueDisabled: {
    color: "rgba(235,235,245,0.35)",
  },
});