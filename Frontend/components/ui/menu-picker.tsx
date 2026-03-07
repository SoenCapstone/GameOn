import { lazy, Suspense, useRef } from "react";
import type NativePickerComponent from "@/components/ui/native-picker";
import {
  Text,
  StyleSheet,
  Pressable,
  View,
  findNodeHandle,
} from "react-native";
import { isRunningInExpoGo } from "@/utils/runtime";
import { Ionicons } from "@expo/vector-icons";
import { useActionSheet } from "@expo/react-native-action-sheet";

interface MenuPickerProps {
  readonly title?: string;
  readonly placeholder?: string;
  readonly options: readonly string[];
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
}

const NativePicker = lazy<typeof NativePickerComponent>(
  () => import("@/components/ui/native-picker"),
);

export function MenuPicker({
  title,
  placeholder,
  options,
  value,
  onValueChange,
  disabled = false,
}: Readonly<MenuPickerProps>) {
  const anchorRef = useRef<View>(null);
  const { showActionSheetWithOptions } = useActionSheet();
  const selectedValue =
    value !== undefined && options.includes(value) ? value : placeholder;
  const displayValue = selectedValue ?? value;

  const onPress = () => {
    if (disabled) return;

    showActionSheetWithOptions(
      {
        title,
        options: [...options],
        anchor: findNodeHandle(anchorRef.current) ?? undefined,
      },
      (buttonIndex) => {
        if (buttonIndex === undefined) return;

        const selectedOption = options[buttonIndex];
        if (selectedOption !== undefined) {
          onValueChange(selectedOption);
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
                {displayValue}
              </Text>
              <Ionicons name="chevron-expand" size={16} color={iconColor} />
            </>
          );
        }}
      </Pressable>
    );
  }

  return (
    <Suspense fallback={null}>
      <NativePicker
        title={title}
        placeholder={placeholder}
        options={options}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </Suspense>
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
