import { Text, TextInput, View } from "react-native";
import { authStyles } from "@/constants/auth-styles";
import { LabeledInputProps } from "@/components/sign-up/models";

export const LabeledInput = ({
  label,
  rightIcon,
  error,
  ...inputProps
}: Readonly<LabeledInputProps>) => {
  return (
    <View style={{ gap: 8 }}>
      <Text style={authStyles.label}>{label}</Text>
      <View
        style={[
          authStyles.inputWrap,
          error ? { borderWidth: 1, borderColor: "#EF4444" } : null,
        ]}
      >
        <TextInput
          {...inputProps}
          style={authStyles.input}
          placeholderTextColor="#FFFFFF"
        />
        {rightIcon ? (
          <View style={authStyles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>
      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
};
