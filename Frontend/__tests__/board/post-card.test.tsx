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
    Pressable: ({ children, onLongPress, ref }: any) =>
      ReactMock.createElement(
        "View",
        { testID: "pressable", onLongPress, ref },
        children,
      ),
    findNodeHandle: (ref: any) => ref?.current ?? undefined,
  };
});

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual("react");
  return {
    Image: (props: any) =>
      ReactMock.createElement("View", { testID: "expo-image", ...props }),
  };
});

jest.mock("javascript-time-ago", () => {
  return class MockTimeAgo {
    format() {
      return "2h";
    }
  };
});

jest.mock("@expo/react-native-action-sheet", () => ({
  useActionSheet: () => ({
    showActionSheetWithOptions: mockShowActionSheet,
  }),
}));

jest.mock("react-native-context-menu-view", () => {
  const ReactMock = jest.requireActual("react");
  return {
    __esModule: true,
    default: ({ children, onPress, actions }: any) =>
      ReactMock.createElement(
        "View",
        {
          testID: "context-menu",
          onPress: () =>
            onPress?.({ nativeEvent: { name: actions?.[0]?.title } }),
        },
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
    authorId: "coach-1",
    authorName: "Coach Amy",
    authorRole: "Coach",
    title: "Practice Update",
    scope: "Members",
    body: "Practice moved to 6pm.",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    runtimeAny.__setExpoGo(false);
  });

  it("renders Image for static/imported logos", () => {
    const mockLogo = require("@/assets/images/react-logo.png");
    const { getByTestId } = render(
      <PostCard post={basePost} spaceName="My Team" spaceLogo={mockLogo} />,
    );

    expect(getByTestId("expo-image")).toBeTruthy();
  });

  it("renders Image for remote logos (URLs)", () => {
    const { getByTestId } = render(
      <PostCard
        post={basePost}
        spaceName="My Team"
        spaceLogo={{ uri: "https://example.com/logo.png" }}
      />,
    );

    expect(getByTestId("expo-image")).toBeTruthy();
  });

  it("deletes via action sheet in Expo Go", () => {
    runtimeAny.__setExpoGo(true);
    mockShowActionSheet.mockImplementation((_, callback) => callback(1));
    const onDelete = jest.fn();
    const mockLogo = require("@/assets/images/react-logo.png");

    const { getByTestId } = render(
      <PostCard
        post={basePost}
        spaceName="My Team"
        spaceLogo={mockLogo}
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
    const mockLogo = require("@/assets/images/react-logo.png");

    const { getByTestId } = render(
      <PostCard
        post={basePost}
        spaceName="My Team"
        spaceLogo={mockLogo}
        onDelete={onDelete}
        canDelete={true}
      />,
    );

    fireEvent.press(getByTestId("context-menu"));

    expect(onDelete).toHaveBeenCalledWith("post-1");
  });
});
