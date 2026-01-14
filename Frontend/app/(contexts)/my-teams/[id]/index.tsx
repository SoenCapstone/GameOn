import React, { useLayoutEffect } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { mockSearchResults } from "@/components/browse/constants";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("My Team Detail");

function MyTeamHeader({
  title,
  id,
  isOwner,
  onFollow,
}: {
  readonly title: string;
  readonly id: string;
  readonly isOwner: boolean;
  readonly onFollow: () => void;
}) {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        isOwner ? (
          <HeaderButton
            type="custom"
            route={`/teams/${id}/settings`}
            icon="gear"
          />
        ) : (
          <HeaderButton type="custom" label="Follow" onPress={onFollow} />
        )
      }
    />
  );
}

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const [refreshing, setRefreshing] = React.useState(false);

  const api = useAxiosWithClerk();
  const { userId } = useAuth();
  const mockTeamImmediate =
    mockSearchResults.find((r) => r.id === id && r.type === "team") || null;
  const {
    data: team,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch team:", err);
        throw err;
      }
    },
    enabled: !!id && !mockTeamImmediate,
    initialData: mockTeamImmediate,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const navigation = useNavigation();

  const handleFollow = React.useCallback(() => {
    log.info(`Owner with id ${userId} has followed team with id ${id}`);
  }, [userId, id]);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
    log.info("Page updated");
  }, [refetch]);

  useLayoutEffect(() => {
    const title =
      (team?.name || mockTeamImmediate?.name) ?? (id ? `Team ${id}` : "Team");
    const isOwner = Boolean(userId && team && team.ownerUserId === userId);

    function renderMyTeamHeader() {
      return (
        <MyTeamHeader
          title={title}
          id={id}
          isOwner={isOwner}
          onFollow={handleFollow}
        />
      );
    }

    navigation.setOptions({ headerTitle: renderMyTeamHeader });
  }, [navigation, team, mockTeamImmediate, id, userId, handleFollow]);

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "red" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
        />
      }
    >
        { isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : null }
    </ContentArea>
  );
}
