import React, { useLayoutEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { useMockTeam } from "@/components/teams/team-helpers";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";

function TeamHeader({ title, id }: { title: string; id: string }) {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        <HeaderButton
          type="custom"
          route={`/teams/${id}/settings`}
          icon="gear"
        />
      }
    />
  );
}

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";
  const { team, loading } = useMockTeam(id);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    const title = team?.name ?? (id ? `Team ${id}` : "Team");

    function renderTeamHeader() {
      return <TeamHeader title={title} id={id} />;
    }

    navigation.setOptions({ headerTitle: renderTeamHeader });
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
