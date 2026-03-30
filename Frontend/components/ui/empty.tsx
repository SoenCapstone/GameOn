import { StyleSheet, Text, View } from "react-native";

interface EmptyProps {
  readonly message: string;
}

const color = "rgba(255,255,255,0.6)";

export function Empty({ message }: Readonly<EmptyProps>) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  message: {
    color: color,
    fontSize: 16,
    maxWidth: "70%",
    textAlign: "center",
  },
});
