import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";

export default function SpacesCreate() {
  const router = useRouter();

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Pressable
          style={styles.item}
          onPress={() => router.push("/teams/create-team")}
        >
          <Text style={styles.itemText}>Create a Team</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={styles.item}
          onPress={() => router.push("/leagues/create-league")}
        >
          <Text style={styles.itemText}>Create a League</Text>
        </Pressable>

        <Pressable style={styles.cancel} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  card: {
    borderRadius: 18,
    backgroundColor: "rgba(50,50,50,0.6)",
    overflow: "hidden",
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cancel: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
  },
});
