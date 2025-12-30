import { TextInput, StyleSheet, TextInputProps } from "react-native";
import { BlurView } from "expo-blur";

export const TextAreaItem = (inputProps: Readonly<TextInputProps>) => {
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <TextInput
        {...inputProps}
        multiline
        style={styles.input}
        textAlignVertical="top"
      />
    </BlurView>
  );
};

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 156,
    borderRadius: 30,
    overflow: "hidden",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 17,
  },
});
