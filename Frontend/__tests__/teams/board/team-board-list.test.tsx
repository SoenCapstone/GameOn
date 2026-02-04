import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TeamBoardList } from "@/components/teams/board/team-board-list";
import { BoardPost } from "@/components/teams/board/team-board-types";

const mockBoardPostCard = jest.fn((props: any) => {
  const ReactMock = jest.requireActual("react");
  const { post, onDelete } = props;
  return ReactMock.createElement(
    "Text",
    {
      testID: `post-${post.id}`,
      onPress: () => onDelete?.(post.id),
    },
    post.content,
  );
});

jest.mock("@/components/teams/board/board-post-card", () => ({
  BoardPostCard: (props: any) => mockBoardPostCard(props),
}));

jest.mock("@legendapp/list", () => {
  const ReactMock = jest.requireActual("react");
  return {
    LegendList: ({
      data,
      renderItem,
      ListHeaderComponent,
      ListEmptyComponent,
      onContentSizeChange,
    }: any) => {
      const items = data?.length
        ? data.map((item: any, index: number) => renderItem({ item, index }))
        : null;

      onContentSizeChange?.();

      return ReactMock.createElement(
        ReactMock.Fragment,
        null,
        ListHeaderComponent,
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
      type: "general",
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
      type: "game",
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
      <TeamBoardList
        posts={posts}
        isLoading={true}
        canPost={false}
        onDeletePost={jest.fn()}
      />,
    );

    expect(queryByText("No announcements yet")).toBeNull();
    expect(mockBoardPostCard).not.toHaveBeenCalled();
  });

  it("renders the empty state messages", () => {
    const { getByText, rerender } = render(
      <TeamBoardList
        posts={[]}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
      />,
    );

    expect(getByText("No announcements yet")).toBeTruthy();

    rerender(
      <TeamBoardList
        posts={[]}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
        searchQuery="coach"
      />,
    );

    expect(getByText("No matching announcements")).toBeTruthy();
  });

  it("filters posts and wires search + delete callbacks", () => {
    const onSearchChange = jest.fn();
    const onDeletePost = jest.fn();

    const { getByPlaceholderText, getByTestId, queryByTestId } = render(
      <TeamBoardList
        posts={posts}
        isLoading={false}
        canPost={true}
        onDeletePost={onDeletePost}
        searchQuery="coach"
        onSearchChange={onSearchChange}
      />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(queryByTestId("post-post-2")).toBeNull();

    fireEvent.changeText(getByPlaceholderText("Search"), "ben");
    expect(onSearchChange).toHaveBeenCalledWith("ben");

    fireEvent.press(getByTestId("post-post-1"));
    expect(onDeletePost).toHaveBeenCalledWith("post-1");
  });

  it("filters by content and author name case-insensitively", () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <TeamBoardList
        posts={posts}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
        searchQuery="PRACTICE"
      />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(queryByTestId("post-post-2")).toBeNull();

    rerender(
      <TeamBoardList
        posts={posts}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
        searchQuery="AMY"
      />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(queryByTestId("post-post-2")).toBeNull();
  });

  it("shows all posts when search query is whitespace only", () => {
    const { getByTestId } = render(
      <TeamBoardList
        posts={posts}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
        searchQuery="   "
      />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(getByTestId("post-post-2")).toBeTruthy();
  });

  it("invokes edit callback and passes isDeletingId to cards", () => {
    const onEditPost = jest.fn();
    const onDeletePost = jest.fn();

    render(
      <TeamBoardList
        posts={posts}
        isLoading={false}
        canPost={true}
        onEditPost={onEditPost}
        onDeletePost={onDeletePost}
        isDeletingId="post-1"
      />,
    );

    expect(mockBoardPostCard).toHaveBeenCalledWith(
      expect.objectContaining({
        post: posts[0],
        canPost: true,
        isDeleting: true,
      }),
    );
    expect(mockBoardPostCard).toHaveBeenCalledWith(
      expect.objectContaining({
        post: posts[1],
        canPost: true,
        isDeleting: false,
      }),
    );
  });

  it("renders default empty message without search query", () => {
    const { getByText } = render(
      <TeamBoardList
        posts={[]}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
      />,
    );

    expect(getByText("No announcements yet")).toBeTruthy();
  });

  it("updates search without callback when onSearchChange is undefined", () => {
    const { getByPlaceholderText } = render(
      <TeamBoardList
        posts={posts}
        isLoading={false}
        canPost={false}
        onDeletePost={jest.fn()}
        searchQuery=""
      />,
    );

    expect(() => {
      fireEvent.changeText(getByPlaceholderText("Search"), "test");
    }).not.toThrow();
  });
});
