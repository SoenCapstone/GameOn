import { BlurView } from "expo-blur";
import { StyleSheet, Text, View } from "react-native";

export function Badge({ label }: Readonly<{ label: string }>) {
  return (
    <View style={styles.row}>
      <BlurView tint="dark" style={styles.blur}>
        <Text style={styles.date}>{label}</Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: "center",
    marginVertical: 16,
    borderRadius: 14,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.36)",
  },
  blur: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  date: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
});
