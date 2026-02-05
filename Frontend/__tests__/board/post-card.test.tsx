import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { PostCard } from "@/components/board/post-card";
import { BoardPost } from "@/components/board/board-types";
import * as runtime from "@/utils/runtime";

const runtimeAny = runtime as any;

const mockShowActionSheet = jest.fn();

jest.mock("react-native", () => {
  const ReactMock = jest.requireActual("react");
  const RN = jest.requireActual("react-native/jest/mock");
  return {
    ...RN,
    View: ({ children, ...props }: any) =>
      ReactMock.createElement("View", props, children),
    Text: ({ children, ...props }: any) =>
      ReactMock.createElement("Text", props, children),
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => style,
    },
    Pressable: ({ children, onLongPress }: any) =>
      ReactMock.createElement(
        "View",
        { testID: "pressable", onLongPress },
        children,
      ),
  };
});

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual("react");
  return {
    Image: (props: any) =>
      ReactMock.createElement("View", { testID: "expo-image", ...props }),
  };
});

jest.mock("react-timeago", () => {
  const ReactMock = jest.requireActual("react");
  return function MockTimeAgo() {
    return ReactMock.createElement("Text", { testID: "timeago" }, "time ago");
  };
});

jest.mock("@expo/react-native-action-sheet", () => ({
  useActionSheet: () => ({
    showActionSheetWithOptions: mockShowActionSheet,
  }),
}));

jest.mock("@expo/ui/swift-ui", () => {
  const ReactMock = jest.requireActual("react");
  const ContextMenu = ({ children }: any) =>
    ReactMock.createElement("View", { testID: "context-menu" }, children);
  ContextMenu.Items = ({ children }: any) =>
    ReactMock.createElement("View", { testID: "context-menu-items" }, children);
  ContextMenu.Trigger = ({ children }: any) =>
    ReactMock.createElement(
      "View",
      { testID: "context-menu-trigger" },
      children,
    );

  return {
    Host: ({ children }: any) =>
      ReactMock.createElement("View", { testID: "host" }, children),
    ContextMenu,
    Button: ({ children, onPress }: any) =>
      ReactMock.createElement(
        "Text",
        { testID: "context-button", onPress },
        children,
      ),
  };
});

jest.mock("@/components/ui/card", () => {
  const ReactMock = jest.requireActual("react");
  return {
    Card: ({ children }: any) =>
      ReactMock.createElement("View", { testID: "card" }, children),
  };
});

jest.mock("@/components/svg-image", () => {
  const ReactMock = jest.requireActual("react");
  return {
    __esModule: true,
    default: (props: any) =>
      ReactMock.createElement("View", { testID: "svg-image", ...props }),
  };
});

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

jest.mock("@/utils/runtime", () => {
  let expoGo = false;
  return {
    get isRunningInExpoGo() {
      return expoGo;
    },
    __setExpoGo: (value: boolean) => {
      expoGo = value;
    },
  };
});

describe("PostCard", () => {
  const basePost: BoardPost = {
    id: "post-1",
    spaceId: "team-1",
    authorId: "coach-1",
    authorName: "Coach Amy",
    title: "Practice Update",
    scope: "players",
    content: "Practice moved to 6pm.",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    runtimeAny.__setExpoGo(false);
  });

  it("renders text logo when logo is not a URL", () => {
    const { getByText, queryByTestId } = render(
      <PostCard post={basePost} sourceName="My Team" sourceLogo="MT" />,
    );

    expect(getByText("My Team")).toBeTruthy();
    expect(getByText("MT")).toBeTruthy();
    expect(queryByTestId("svg-image")).toBeNull();
    expect(queryByTestId("expo-image")).toBeNull();
  });

  it("renders SvgImage for remote svg logos", () => {
    const { getByTestId } = render(
      <PostCard
        post={basePost}
        sourceName="My Team"
        sourceLogo="https://example.com/logo.svg"
      />,
    );

    expect(getByTestId("svg-image")).toBeTruthy();
  });

  it("renders Image for remote non-svg logos", () => {
    const { getByTestId } = render(
      <PostCard
        post={basePost}
        sourceName="My Team"
        sourceLogo="https://example.com/logo.png"
      />,
    );

    expect(getByTestId("expo-image")).toBeTruthy();
  });

  it("deletes via action sheet in Expo Go", () => {
    runtimeAny.__setExpoGo(true);
    mockShowActionSheet.mockImplementation((_, callback) => callback(1));
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <PostCard
        post={basePost}
        sourceName="My Team"
        sourceLogo="MT"
        onDelete={onDelete}
        canDelete={true}
      />,
    );

    fireEvent(getByTestId("pressable"), "onLongPress");

    expect(mockShowActionSheet).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("post-1");
  });

  it("deletes directly when not in Expo Go", () => {
    runtimeAny.__setExpoGo(false);
    const onDelete = jest.fn();

    const { getByTestId } = render(
      <PostCard
        post={basePost}
        sourceName="My Team"
        sourceLogo="MT"
        onDelete={onDelete}
        canDelete={true}
      />,
    );

    fireEvent.press(getByTestId("context-button"));

    expect(onDelete).toHaveBeenCalledWith("post-1");
  });
});
