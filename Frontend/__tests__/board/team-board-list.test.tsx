/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { render } from "@testing-library/react-native";
import { BoardList } from "@/components/board/board-list";
import { BoardPost } from "@/components/board/board-types";

// Mock @expo/ui/swift-ui to suppress native component warnings
jest.mock("@expo/ui/swift-ui", () => {
  const mockReact = require("react");
  const { View, Text, Pressable } = require("react-native");
  
  return {
    Host: ({ children, ...props }: any) => mockReact.createElement(View, props, children),
    ContextMenu: ({ children, ...props }: any) => mockReact.createElement(View, props, children),
    Button: ({ children, onPress, ...props }: any) => 
      mockReact.createElement(Pressable, { onPress, ...props }, 
        mockReact.createElement(Text, null, children)
      ),
  };
});

const mockPostCard = jest.fn((props: any) => {
  const { post } = props;
  return React.createElement(
    "Text",
    {
      testID: `post-${post.id}`,
    },
    post.content,
  );
});

jest.mock("@/components/board/post-card", () => ({
  PostCard: (props: any) => mockPostCard(props),
}));

jest.mock("@legendapp/list", () => {
  return {
    LegendList: ({
      data,
      renderItem,
      keyExtractor,
      ListEmptyComponent,
      onContentSizeChange,
    }: any) => {
      const mockReact = require("react");
      const items = data?.length
        ? data.map((item: any, index: number) => {
            const key = keyExtractor ? keyExtractor(item, index) : index;
            return mockReact.cloneElement(renderItem({ item, index }), { key });
          })
        : null;

      onContentSizeChange?.();

      return mockReact.createElement(
        mockReact.Fragment,
        null,
        items,
        data?.length ? null : ListEmptyComponent,
      );
    },
  };
});

jest.mock("expo-glass-effect", () => {
  return {
    GlassView: ({ children }: any) => {
      const mockReact = require("react");
      return mockReact.createElement("View", null, children);
    },
  };
});

jest.mock("react-native-vector-icons/Ionicons", () => {
  return function MockIcon() {
    return null;
  };
});

describe("TeamBoardList", () => {
  const posts: BoardPost[] = [
    {
      id: "post-1",
      spaceId: "team-1",
      authorId: "coach-1",
      authorName: "Coach Amy",
      title: "Practice Update",
      scope: "players",
      content: "Practice moved to 6pm.",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "post-2",
      spaceId: "team-1",
      authorId: "player-1",
      authorName: "Player Ben",
      title: "Game Announcement",
      scope: "everyone",
      content: "Game day is Saturday.",
      createdAt: "2024-01-02T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state without empty messaging", () => {
    const { queryByText } = render(
      <BoardList posts={posts} isLoading={true} sourceName="Team" />,
    );

    expect(queryByText("No announcements yet")).toBeNull();
    expect(mockPostCard).not.toHaveBeenCalled();
  });

  it("renders the empty state message", () => {
    const { getByText } = render(
      <BoardList posts={[]} isLoading={false} sourceName="Team" />,
    );

    expect(getByText("No announcements yet")).toBeTruthy();
  });

  it("filters posts and displays them", () => {
    const { getByTestId } = render(
      <BoardList posts={posts} isLoading={false} sourceName="Team" />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(getByTestId("post-post-2")).toBeTruthy();
  });

  it("passes correct props to PostCard components", () => {
    render(
      <BoardList
        posts={posts}
        isLoading={false}
        sourceName="My Team"
        sourceLogo="https://example.com/logo.png"
      />,
    );

    expect(mockPostCard).toHaveBeenCalledTimes(2);
    expect(mockPostCard).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sourceName: "My Team",
        sourceLogo: "https://example.com/logo.png",
      }),
    );
    expect(mockPostCard).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sourceName: "My Team",
        sourceLogo: "https://example.com/logo.png",
      }),
    );
  });
});
