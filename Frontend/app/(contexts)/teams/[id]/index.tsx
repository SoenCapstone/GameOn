import React from "react";
import { View, ActivityIndicator, Text, RefreshControl } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Card } from "@/components/ui/card";
import { createTeamStyles } from "@/components/teams/teams-styles";
import { useSearch } from "@/contexts/search-context";
import { useMockTeamBoard } from "@/components/teams/use-mock-team-board";
import { useTeamDetail } from "@/hooks/use-team-detail";
import { useTeamHeader } from "@/hooks/use-team-header";

export default function TeamDetailById() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");

  const [tab, setTab] = React.useState<"board" | "overview" | "games">("board");

  const { query } = useSearch();
  const { items, loading: boardLoading } = useMockTeamBoard(id, query);

  const { isLoading, refreshing, onRefresh, handleFollow, title, isOwner } =
    useTeamDetail(id);

  useTeamHeader({ title, id, isOwner, onFollow: handleFollow });

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
      <View style={createTeamStyles.container}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            {refreshing && <ActivityIndicator size="small" color="#fff" />}
            <SegmentedControl
              values={["Board", "Overview", "Games"]}
              selectedIndex={tab === "board" ? 0 : tab === "overview" ? 1 : 2}
              onValueChange={(value) => {
                if (value === "Board") setTab("board");
                if (value === "Overview") setTab("overview");
                if (value === "Games") setTab("games");
              }}
              style={{ marginBottom: 12, width: "90%" }}
            />

            {tab === "board" && (
              <View style={createTeamStyles.boardList}>
                {boardLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : items.length === 0 ? (
                  <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                    No board cards (query: &quot;{query}&quot;)
                  </Text>
                ) : (
                  items.map((item) => (
                    <Card key={item.id}>
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
                                fontWeight: "500",
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
