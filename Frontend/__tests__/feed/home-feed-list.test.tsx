import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { HomeFeedList } from "@/components/feed/home-feed-list";
import type { HomeFeedItem, HomeFeedMatchItem } from "@/types/feed";

const mockReact = jest.requireActual("react") as typeof import("react");

const mockPost = jest.fn(
  ({ spaceName }: { spaceName: string }) =>
    React.createElement("Text", { testID: `post-${spaceName}` }, spaceName),
);

const mockMatchCard = jest.fn(
  ({ onPress }: { onPress?: () => void }) =>
    React.createElement(
      "Pressable",
      {
        testID: "match-card",
        onPress,
      },
      null,
    ),
);

jest.mock("@/components/board/post", () => ({
  Post: (props: { spaceName: string; [key: string]: unknown }) =>
    mockPost(props),
}));

jest.mock("@/components/matches/match-card", () => ({
  MatchCard: (props: { onPress?: () => void; [key: string]: unknown }) =>
    mockMatchCard(props),
}));

jest.mock("@/components/ui/loading", () => ({
  Loading: () => {
    return mockReact.createElement("Text", { testID: "loading" }, "Loading");
  },
}));

jest.mock("@/components/ui/empty", () => ({
  Empty: ({ message }: { message: string }) => {
    return mockReact.createElement("Text", { testID: "empty" }, message);
  },
}));

jest.mock("@/utils/search", () => ({
  getSportLogo: jest.fn(() => ({ uri: "sport://logo" })),
}));

jest.mock("@legendapp/list/react-native", () => {
  return {
    LegendList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: HomeFeedItem[];
      renderItem: (args: {
        item: HomeFeedItem;
        index: number;
      }) => React.ReactElement;
      keyExtractor?: (item: HomeFeedItem, index: number) => string;
    }) =>
      mockReact.createElement(
        mockReact.Fragment,
        null,
        data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : String(index);
          return mockReact.cloneElement(renderItem({ item, index }), { key });
        }),
      ),
  };
});

describe("HomeFeedList", () => {
  const postItem: HomeFeedItem = {
    kind: "post",
    id: "post-1",
    createdAt: "2026-04-01T10:00:00.000Z",
    space: {
      id: "team-1",
      kind: "team",
      name: "Raptors",
      logoUrl: null,
      sport: "basketball",
    },
    post: {
      id: "post-1",
      authorName: "Coach",
      title: "Update",
      scope: "Members",
      body: "Practice at 7",
      createdAt: "2026-04-01T10:00:00.000Z",
    },
  };

  const matchItem: HomeFeedMatchItem = {
    kind: "match",
    id: "match-1",
    createdAt: "2026-04-01T08:00:00.000Z",
    space: {
      id: "league-1",
      kind: "league",
      name: "Spring League",
      logoUrl: null,
      sport: "soccer",
    },
    match: {
      id: "match-1",
      leagueId: "league-1",
      status: "CONFIRMED",
      homeTeamId: "team-1",
      awayTeamId: "team-2",
      sport: "soccer",
      startTime: "2026-05-01T10:00:00.000Z",
      endTime: "2026-05-01T11:00:00.000Z",
      requiresReferee: false,
      createdByUserId: "user-1",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-01T08:00:00.000Z",
    },
    contextLabel: "Spring League",
    homeName: "Raptors",
    awayName: "Wolves",
    sport: "soccer",
    status: "CONFIRMED",
    startTime: "2026-05-01T10:00:00.000Z",
    isPast: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    const { getByTestId } = render(
      <HomeFeedList items={[]} isLoading={true} errorText={null} />,
    );

    expect(getByTestId("loading")).toBeTruthy();
  });

  it("renders error state", () => {
    const { getByText } = render(
      <HomeFeedList items={[]} isLoading={false} errorText="boom" />,
    );

    expect(getByText("Failed to load feed: boom")).toBeTruthy();
  });

  it("renders empty state", () => {
    const { getByTestId, getByText } = render(
      <HomeFeedList items={[]} isLoading={false} errorText={null} />,
    );

    expect(getByTestId("empty")).toBeTruthy();
    expect(getByText("No updates available")).toBeTruthy();
  });

  it("renders post and match rows and handles match press", () => {
    const onMatchPress = jest.fn();
    const { getByTestId } = render(
      <HomeFeedList
        items={[postItem, matchItem]}
        isLoading={false}
        errorText={null}
        onMatchPress={onMatchPress}
      />,
    );

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceName: "Raptors",
      }),
    );

    fireEvent.press(getByTestId("match-card"));
    expect(onMatchPress).toHaveBeenCalledWith(matchItem);
  });

  it("passes undefined onPress when onMatchPress is omitted", () => {
    render(
      <HomeFeedList items={[matchItem]} isLoading={false} errorText={null} />,
    );

    expect(mockMatchCard).toHaveBeenCalledWith(
      expect.objectContaining({
        onPress: undefined,
      }),
    );
  });
});
