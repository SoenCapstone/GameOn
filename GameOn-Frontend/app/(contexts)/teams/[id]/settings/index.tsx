import React, { useLayoutEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { useMockTeam, SettingsHeader } from "@/components/teams/team-helpers";

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";
  const { team, loading } = useMockTeam(id);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: () => <SettingsHeader /> });
  }, [navigation, team, id]);

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "red" }}
    >
      <View style={styles.container}>
        {loading ? <ActivityIndicator size="large" color="#fff" /> : null}
      </View>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
  },
});
