import { StyleSheet, Text } from "react-native";
import { Callout as MapCallout } from "react-native-maps";
import { GlassView } from "expo-glass-effect";

export interface CalloutProps {
  readonly name: string;
  readonly detail: string;
}

export function Callout({ name, detail }: CalloutProps) {
  return (
    <MapCallout tooltip>
      <GlassView isInteractive={false} style={styles.glass}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.detail} numberOfLines={3}>
          {detail}
        </Text>
      </GlassView>
    </MapCallout>
  );
}

const styles = StyleSheet.create({
  glass: {
    maxWidth: 280,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    borderCurve: "continuous",
    gap: 4,
  },
  name: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  detail: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
  },
});
