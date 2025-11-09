import { Text, TextInput, View } from "react-native";
import { authStyles } from "@/constants/auth-styles";
import { LabeledInputProps } from "@/components/sign-up/models";
import { BlurView } from "expo-blur";  


export const LabeledInput = ({
  label,
  rightIcon,
  error,
  ...inputProps
}: Readonly<LabeledInputProps>) => {
  return (
    <View style={{ gap: 8 }}>
      <Text style={authStyles.label}>{label}</Text>
      <BlurView
        intensity={90}
        tint="dark"
        style={[
          authStyles.inputWrap,
          {
            backgroundColor: "rgba(40, 40, 40, 0.08)",
            overflow: "hidden",
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.25)",
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
          },
          error ? { borderColor: "#EF4444" } : null,
        ]}
      >

          <TextInput
            {...inputProps}
            style={authStyles.input}
            placeholderTextColor="#535252ff"
          />
          {rightIcon ? (
            <View style={authStyles.rightIcon}>{rightIcon}</View>
          ) : null}
      </BlurView>
        {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
};
