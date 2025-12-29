import React, { useLayoutEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { useMockTeam } from "@/components/teams/team-helpers";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Card } from "@/components/ui/card";
import { createTeamStyles } from "@/components/teams/teams-styles";
import { useSearch } from "@/contexts/search-context";
import { useMockTeamBoard } from "@/components/teams/use-mock-team-board";

function TeamHeader({
  title,
  id,
}: {
  readonly title: string;
  readonly id: string;
}) {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        <HeaderButton type="custom" route={`/teams/${id}/settings`} icon="gear" />
      }
    />
  );
}

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  // ✅ FIX 1: normalize id (string[] happens sometimes)
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const { team, loading } = useMockTeam(id);

  const navigation = useNavigation();

  const [tab, setTab] = React.useState<"board" | "overview" | "games">("board");

  const { query } = useSearch();
  const { items, loading: boardLoading } = useMockTeamBoard(id, query);

  useLayoutEffect(() => {
    const title = team?.name ?? (id ? `Team ${id}` : "Team");

    function renderTeamHeader() {
      return <TeamHeader title={title} id={id} />;
    }

    navigation.setOptions({ headerTitle: renderTeamHeader });
  }, [navigation, team, id]);

  return (
    <ContentArea scrollable paddingBottom={60} backgroundProps={{ preset: "red" }}>
      <View style={createTeamStyles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <SegmentedControl
              values={["Board", "Overview", "Games"]}
              selectedIndex={tab === "board" ? 0 : tab === "overview" ? 1 : 2}
              onValueChange={(value) => {
                if (value === "Board") setTab("board");
                if (value === "Overview") setTab("overview");
                if (value === "Games") setTab("games");
              }}
              style={{ marginBottom: 16, width: "90%" }}
            />

            {tab === "board" && (
              <View style={createTeamStyles.boardList}>
                {boardLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : items.length === 0 ? (
                  <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                    No board cards (query: "{query}")
                  </Text>
                ) : (
                  items.map((item) => (
                    <Card key={item.id}>
                      {/* ✅ ADDED: show richer data */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.85)",
                            fontSize: 12,
                          }}
                        >
                          {item.category}
                        </Text>

                        {item.unreadCount > 0 && (
                          <View
                            style={{
                              minWidth: 26,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 999,
                              backgroundColor: "rgba(255,255,255,0.18)",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: "600",
                              }}
                            >
                              {item.unreadCount}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: "700",
                          marginTop: 8,
                        }}
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={{
                          color: "rgba(255,255,255,0.75)",
                          marginTop: 6,
                          lineHeight: 18,
                        }}
                      >
                        {item.description}
                      </Text>

                      <View style={{ marginTop: 12, gap: 4 }}>
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.65)",
                            fontSize: 12,
                          }}
                        >
                          By {item.author}
                        </Text>

                        <Text
                          style={{
                            color: "rgba(255,255,255,0.65)",
                            fontSize: 12,
                          }}
                        >
                          Posted {new Date(item.createdAt).toLocaleString()}
                        </Text>

                        {item.dueAt && (
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.65)",
                              fontSize: 12,
                            }}
                          >
                            Due {new Date(item.dueAt).toLocaleString()}
                          </Text>
                        )}
                      </View>

                      {item.tags.length > 0 && (
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 8,
                            marginTop: 12,
                          }}
                        >
                          {item.tags.map((t) => (
                            <View
                              key={`${item.id}-${t}`}
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 999,
                                backgroundColor: "rgba(255,255,255,0.12)",
                              }}
                            >
                              <Text
                                style={{
                                  color: "rgba(255,255,255,0.85)",
                                  fontSize: 12,
                                }}
                              >
                                {t}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={createTeamStyles.cardSpacer} />
                    </Card>
                  ))
                )}
              </View>
            )}

            {tab === "overview" && (
              <Text style={{ color: "white" }}>Overview content here</Text>
            )}

            {tab === "games" && (
              <Text style={{ color: "white" }}>Games content here</Text>
            )}
          </>
        )}
      </View>
    </ContentArea>
  );
}
