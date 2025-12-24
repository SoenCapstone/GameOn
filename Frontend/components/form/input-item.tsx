import { Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { BlurView } from "expo-blur";

interface InputProps extends TextInputProps {
  readonly label: string;
}

export const InputItem = ({ label, ...inputProps }: Readonly<InputProps>) => {
  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...inputProps} style={styles.input} />
    </BlurView>
  );
};

const styles = StyleSheet.create({
  item: {
    width: "100%",
    height: 52,
    borderRadius: 30,
    overflow: "hidden",
    paddingLeft: 20,
    paddingRight: 20,
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
