import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";

import { ContentArea } from "@/components/ui/content-area";
import { PageTitle } from "@/components/header/page-title";

type Mode = "overview" | "games" | "teams";

export default function LeagueDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mode, setMode] = React.useState<Mode>("overview");

  const selectedIndex = mode === "overview" ? 0 : mode === "games" ? 1 : 2;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <PageTitle title={`League ${String(id)}`} />,
        }}
      />

      <ContentArea
        scrollable
        paddingBottom={60}
        backgroundProps={{ preset: "purple" }}
      >
        <View style={styles.body}>
          <SegmentedControl
            values={["Overview", "Games", "Teams"]}
            selectedIndex={selectedIndex}
            onValueChange={(value) => {
              if (value === "Overview") setMode("overview");
              else if (value === "Games") setMode("games");
              else setMode("teams");
            }}
            style={styles.segmented}
          />

          <View style={styles.card}>
            <Text style={styles.placeholder}>
              {mode === "overview" &&
                "Overview placeholder. Backend will plug real data."}
              {mode === "games" &&
                "Games placeholder. Backend will plug real data."}
              {mode === "teams" &&
                "Teams/standings placeholder. Backend will plug real data."}
            </Text>
          </View>
        </View>
      </ContentArea>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingTop: 0, //  pushes content below the transparent header
  },
  segmented: {
    height: 40,
    marginBottom: 14,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    minHeight: 240,
  },
  placeholder: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    lineHeight: 20,
  },
});
