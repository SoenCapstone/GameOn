import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { BoardPostCard } from "@/components/teams/board/board-post-card";
import { BoardPost } from "@/components/teams/board/team-board-types";

jest.mock("@/components/ui/card", () => {
  return {
    Card: ({ children }: any) => children,
  };
});

jest.mock("react-native-vector-icons/MaterialIcons", () => {
  return function MockIcon() {
    return null;
  };
});

jest.mock("react-native-popup-menu", () => {
  const ReactMock = jest.requireActual("react");
  return {
    Menu: ({ children }: any) => children,
    MenuTrigger: ({ children }: any) => children,
    MenuOptions: ({ children }: any) => children,
    MenuOption: ({ children, onSelect }: any) =>
      ReactMock.createElement("Text", { onPress: onSelect }, children),
  };
});

describe("BoardPostCard", () => {
  const basePost: BoardPost = {
    id: "post-1",
    teamId: "team-1",
    authorId: "user-1",
    authorName: "Coach K",
    type: "game",
    scope: "players",
    content: "Practice moved to 6pm.",
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("renders post details and hides menu when user cannot post", () => {
    jest
      .spyOn(Date.prototype, "toLocaleDateString")
      .mockReturnValue("01/15/2024");

    const { getByText, queryByText } = render(
      <BoardPostCard post={basePost} canPost={false} />,
    );

    expect(getByText("game")).toBeTruthy();
    expect(getByText("Team Members")).toBeTruthy();
    expect(getByText("Coach K")).toBeTruthy();
    expect(getByText("Practice moved to 6pm.")).toBeTruthy();
    expect(getByText("01/15/2024")).toBeTruthy();
    expect(queryByText("Edit")).toBeNull();
    expect(queryByText("Delete")).toBeNull();
  });

  it("invokes edit and delete when menu options pressed", () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    const { getByText } = render(
      <BoardPostCard
        post={basePost}
        canPost={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.press(getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(basePost);

    fireEvent.press(getByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith("post-1");
  });

  it("hides menu options while deleting", () => {
    const { queryByText } = render(
      <BoardPostCard post={basePost} canPost={true} isDeleting={true} />,
    );

    expect(queryByText("Edit")).toBeNull();
    expect(queryByText("Delete")).toBeNull();
  });
});
