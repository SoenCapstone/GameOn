import React, { useLayoutEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { useMockTeam } from "@/components/teams/team-helpers";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";

function SettingsHeader() {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title="Team Settings" />}
    />
  );
}

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";
  const { team, loading } = useMockTeam(id);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    function renderSettingsHeader() {
      return <SettingsHeader />;
    }

    navigation.setOptions({ headerTitle: renderSettingsHeader });
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
