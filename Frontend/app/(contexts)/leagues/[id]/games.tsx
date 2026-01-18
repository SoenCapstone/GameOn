import React from "react";
import { View, Text } from "react-native";
import { Background } from "@/components/ui/background";
import { styles } from "./league.styles";

export default function LeagueGamesScreen() {
  return (
    <View style={styles.screen}>
      <Background preset="purple" mode="default" />
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Games</Text>
        <Text style={styles.emptySub}>Coming soon</Text>
      </View>
    </View>
  );
}
