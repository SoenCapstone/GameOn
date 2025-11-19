import React, { useEffect, useLayoutEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { mockSearchResults, SearchResult } from "@/components/browse/constants";

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";
  const [team, setTeam] = useState<SearchResult | null>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const currentTeam = mockSearchResults.find((r) => r.id === id && r.type === "team") as SearchResult | undefined;
    setTeam(currentTeam ?? null);
    setLoading(false);
  }, [id]);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
            left={<HeaderButton type="back" />}
            center={<PageTitle title="Team Settings" />}
        />
      ),
    });
  }, [navigation, team, id]);

  return (
    <ContentArea scrollable paddingBottom={60} backgroundProps={{ preset: "red" }}>
      <View />
    </ContentArea>
  );
}
