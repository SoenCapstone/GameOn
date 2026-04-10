import React from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { render } from "@testing-library/react-native";
import { BoardList } from "@/components/board/board-list";
import { BoardPost } from "@/components/board/board-types";

const mockScrollToIndex = jest.fn();

jest.mock("react-native-context-menu-view", () => {
  const mockReact = jest.requireActual("react") as typeof import("react");
  const { View: MockView } = jest.requireActual(
    "react-native",
  ) as typeof import("react-native");
  return {
    __esModule: true,
    default: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => mockReact.createElement(MockView, props, children),
  };
});

const mockPost = jest.fn(
  (props: { post: BoardPost; [key: string]: unknown }) => {
    const { post } = props;
    return React.createElement(
      "Text",
      {
        testID: `post-${post.id}`,
      },
      post.body,
    );
  },
);

jest.mock("@/components/board/post", () => ({
  Post: (props: { post: BoardPost; [key: string]: unknown }) => mockPost(props),
}));

jest.mock("@legendapp/list/react-native", () => {
  const mockReact = jest.requireActual("react") as typeof import("react");
  const { useEffect, useImperativeHandle } = mockReact;
  return {
    LegendList: mockReact.forwardRef(
      (
        {
          data,
          renderItem,
          keyExtractor,
          ListEmptyComponent,
          onContentSizeChange,
        }: {
          data: unknown[];
          renderItem: (args: {
            item: unknown;
            index: number;
          }) => React.ReactElement;
          keyExtractor?: (item: unknown, index: number) => string | number;
          ListEmptyComponent?: React.ReactElement;
          onContentSizeChange?: () => void;
        },
        ref: React.Ref<{ scrollToIndex: (params: unknown) => void }>,
      ) => {
        useImperativeHandle(ref, () => ({
          scrollToIndex: mockScrollToIndex,
        }));

        useEffect(() => {
          onContentSizeChange?.();
        }, [onContentSizeChange]);

        const items = data?.length
          ? data.map((item, index) => {
              const key = keyExtractor ? keyExtractor(item, index) : index;
              return mockReact.cloneElement(renderItem({ item, index }), {
                key,
              });
            })
          : null;

        return mockReact.createElement(
          mockReact.Fragment,
          null,
          items,
          data?.length ? null : ListEmptyComponent,
        );
      },
    ),
  };
});

jest.mock("expo-glass-effect", () => {
  const mockReact = jest.requireActual("react") as typeof import("react");
  return {
    GlassView: ({ children }: { children?: React.ReactNode }) => {
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
      authorName: "Coach Amy",
      title: "Practice Update",
      scope: "Members",
      body: "Practice moved to 6pm.",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "post-2",
      authorName: "Player Ben",
      title: "Game Announcement",
      scope: "Everyone",
      body: "Game day is Saturday.",
      createdAt: "2024-01-02T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    }) as typeof global.requestAnimationFrame;
    global.requestIdleCallback = ((cb: IdleRequestCallback) => {
      cb({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline);
      return 1;
    }) as typeof global.requestIdleCallback;
    global.cancelIdleCallback = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders loading state without empty messaging", () => {
    const { queryByText } = render(
      <BoardList
        posts={posts}
        isLoading={true}
        spaceName="Team"
        spaceLogo={{ uri: "https://example.com/logo.png" }}
      />,
    );

    expect(queryByText("No posts available")).toBeNull();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("renders the empty state message", () => {
    const { getByText } = render(
      <BoardList
        posts={[]}
        isLoading={false}
        spaceName="Team"
        spaceLogo={{ uri: "https://example.com/logo.png" }}
      />,
    );

    expect(getByText("No posts available")).toBeTruthy();
  });

  it("filters posts and displays them", () => {
    const { getByTestId } = render(
      <BoardList
        posts={posts}
        isLoading={false}
        spaceName="Team"
        spaceLogo={{ uri: "https://example.com/logo.png" }}
      />,
    );

    expect(getByTestId("post-post-1")).toBeTruthy();
    expect(getByTestId("post-post-2")).toBeTruthy();
  });

  it("passes correct props to Post components", () => {
    render(
      <BoardList
        posts={posts}
        isLoading={false}
        spaceName="My Team"
        spaceLogo={{ uri: "https://example.com/logo.png" }}
      />,
    );

    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        spaceName: "My Team",
        spaceLogo: { uri: "https://example.com/logo.png" },
      }),
    );
    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        spaceName: "My Team",
        spaceLogo: { uri: "https://example.com/logo.png" },
      }),
    );
  });

  it("auto-scrolls to target post index when targetPostId is provided", () => {
    render(
      <BoardList
        posts={posts}
        isLoading={false}
        spaceName="Team"
        spaceLogo={{ uri: "https://example.com/logo.png" }}
        targetPostId="post-2"
      />,
    );

    jest.runAllTimers();

    expect(mockScrollToIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 1,
        animated: true,
      }),
    );
  });
});
