import { View } from "react-native";
import { Host, Picker, Text as SwiftText } from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  fixedSize,
  foregroundStyle,
  opacity,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";

interface NativePickerProps {
  readonly title?: string;
  readonly placeholder?: string;
  readonly options: readonly string[];
  readonly value: string | undefined;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
}

export default function NativePicker({
  title,
  placeholder,
  options,
  value,
  onValueChange,
  disabled = false,
}: Readonly<NativePickerProps>) {
  const selectedValue =
    value !== undefined && options.includes(value) ? value : placeholder;
  const pickerColor = disabled
    ? "rgba(235,235,245,0.35)"
    : "rgba(235,235,245,0.6)";

  return (
    <View>
      <Host matchContents>
        <Picker
          label={title}
          modifiers={[
            fixedSize({ horizontal: true, vertical: true }),
            disabledModifier(disabled),
            pickerStyle("menu"),
            tint(pickerColor),
            foregroundStyle(pickerColor),
            opacity(disabled ? 0.5 : 1),
          ]}
          selection={selectedValue}
          onSelectionChange={(selection) => {
            if (typeof selection === "string" && selection !== placeholder) {
              onValueChange(selection);
            }
          }}
        >
          {placeholder ? (
            <SwiftText key={placeholder} modifiers={[tag(placeholder)]}>
              {placeholder}
            </SwiftText>
          ) : null}
          {options.map((option, index) => (
            <SwiftText key={`${option}-${index}`} modifiers={[tag(option)]}>
              {option}
            </SwiftText>
          ))}
        </Picker>
      </Host>
    </View>
  );
}
