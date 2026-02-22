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
  const hasOptions = options.length > 0;
  const selectedIndex = options.indexOf(value);
  let safeSelectedIndex: number | undefined;
  if (selectedIndex >= 0) {
    safeSelectedIndex = selectedIndex;
  } else if (hasOptions) {
    safeSelectedIndex = 0;
  }
  const isDisabled = disabled || !hasOptions;

  const onPress = () => {
    if (isDisabled) return;

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

  const getIconColor = (pressed: boolean) => {
    if (isDisabled) return "rgba(235,235,245,0.35)";
    if (pressed) return "rgba(235,235,245,0.7)";
    return "rgba(235,235,245,0.6)";
  };

  if (isRunningInExpoGo) {
    return (
      <Pressable
        ref={anchorRef}
        style={styles.button}
        onPress={onPress}
        disabled={isDisabled}
      >
        {({ pressed }) => {
          const iconColor = getIconColor(pressed);

          return (
            <>
              <Text
                style={[
                  styles.value,
                  isDisabled && styles.valueDisabled,
                  pressed && { color: "rgba(235,235,245,0.7)" },
                ]}
              >
                {hasOptions ? value : "No options"}
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
            disabledModifier(isDisabled),
            opacity(isDisabled ? 0.5 : 1),
          ]}
          options={hasOptions ? [...options] : ["No options"]}
          selectedIndex={safeSelectedIndex ?? 0}
          onOptionSelected={(event) =>
            hasOptions ? onValueChange(options[event.nativeEvent.index]) : null
          }
          variant="menu"
          color={isDisabled ? "rgba(235,235,245,0.35)" : "rgba(235,235,245,0.6)"}
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
