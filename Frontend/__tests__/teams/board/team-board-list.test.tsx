import React from "react";
import { render } from "@testing-library/react-native";
import { TeamBoardList } from "@/components/teams/board/team-board-list";
import { BoardPost } from "@/components/teams/board/team-board-types";

const mockPostCard = jest.fn((props: any) => {
  const ReactMock = jest.requireActual("react");
  const { post } = props;
  return ReactMock.createElement(
    "Text",
    {
      testID: `post-${post.id}`,
    },
    post.content,
  );
});

jest.mock("@/components/posts/post-card", () => ({
  PostCard: (props: any) => mockPostCard(props),
}));

jest.mock("@legendapp/list", () => {
  const ReactMock = jest.requireActual("react");
  return {
    LegendList: ({
      data,
      renderItem,
      keyExtractor,
      ListEmptyComponent,
      onContentSizeChange,
    }: any) => {
      const items = data?.length
        ? data.map((item: any, index: number) => {
            const key = keyExtractor ? keyExtractor(item, index) : index;
            return ReactMock.cloneElement(renderItem({ item, index }), { key });
          })
        : null;

      onContentSizeChange?.();

      return ReactMock.createElement(
        ReactMock.Fragment,
        null,
        items,
        data?.length ? null : ListEmptyComponent,
      );
    },
  };
});

jest.mock("expo-glass-effect", () => {
  const ReactMock = jest.requireActual("react");
  return {
    GlassView: ({ children }: any) =>
      ReactMock.createElement("View", null, children),
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
      teamId: "team-1",
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
      teamId: "team-1",
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
      <TeamBoardList posts={posts} isLoading={true} sourceName="Team" />,
    );

    expect(queryByText("No announcements yet")).toBeNull();
    expect(mockPostCard).not.toHaveBeenCalled();
  });

  it("renders the empty state message", () => {
    const { getByText } = render(
      <TeamBoardList posts={[]} isLoading={false} sourceName="Team" />,
    );

    expect(getByText("No announcements yet")).toBeTruthy();
  });

  it("filters posts and displays them", () => {
    const { getByTestId } = render(
      <TeamBoardList posts={posts} isLoading={false} sourceName="Team" />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(getByTestId("post-post-2")).toBeTruthy();
  });

  it("passes correct props to PostCard components", () => {
    render(
      <TeamBoardList
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
