import { ActivityIndicator, StyleSheet, View } from "react-native";

interface LoadingProps {
  readonly color?: string;
  readonly size?: "small" | "large";
}

export function Loading({
  color = "white",
  size = "small",
}: Readonly<LoadingProps>) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
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
});
