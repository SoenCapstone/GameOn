import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PlayMakerPlayList } from "@/components/play-maker/play-maker-play-list";
import { usePlayDetails } from "@/hooks/use-play-details";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";

type TestPersonShape = {
  type: "person";
  id: string;
  x: number;
  y: number;
  size: number;
  associatedPlayerId?: string;
};

type TestArrowShape = {
  type: "arrow";
  id: string;
  from?: { id?: string; x?: number; y?: number; size?: number };
  to?: { id?: string; x?: number; y?: number; size?: number };
};

type TestShape = TestPersonShape | TestArrowShape;

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  RelativePathString: "RelativePathString",
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/use-play-details", () => ({
  __esModule: true,
  usePlayDetails: jest.fn(),
}));

jest.mock("@/hooks/use-render-play-maker-shapes", () => ({
  __esModule: true,
  useRenderPlayMakerShapes: jest.fn(),
}));

jest.mock("@/components/ui/card", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const { View: MockView } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    __esModule: true,
    Card: ({ children }: { children: React.ReactNode }) =>
      mockReact.createElement(MockView, null, children),
  };
});

jest.mock("@/components/ui/empty", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const { Text: MockText, View: MockView } = jest.requireActual<
    typeof import("react-native")
  >("react-native");

  return {
    __esModule: true,
    Empty: ({ message }: { message: string }) =>
      mockReact.createElement(
        MockView,
        null,
        mockReact.createElement(MockText, null, message),
      ),
  };
});

jest.mock("@/components/play-maker/play-maker-default-board", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const { View: MockView } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    __esModule: true,
    DefaultBoard: ({ children }: { children?: React.ReactNode }) =>
      mockReact.createElement(MockView, { testID: "default-board" }, children),
  };
});

jest.mock("@/components/ui/loading", () => {
  const mockReact = jest.requireActual<typeof import("react")>("react");
  const { Text: MockText } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    __esModule: true,
    Loading: () => mockReact.createElement(MockText, null, "Loading"),
  };
});

const mockUsePlayDetails = usePlayDetails as jest.MockedFunction<
  typeof usePlayDetails
>;
const mockUseRenderPlayMakerShapes = useRenderPlayMakerShapes as jest.MockedFunction<
  typeof useRenderPlayMakerShapes
>;

const playOneItems = [
  {
    type: "person" as const,
    id: "node-1",
    x: 10,
    y: 20,
    size: 28,
    associatedPlayerId: "player-1",
  },
  {
    type: "person" as const,
    id: "node-2",
    x: 80,
    y: 90,
    size: 30,
  },
  {
    type: "arrow" as const,
    id: "arrow-1",
    from: { id: "node-1" },
    to: { id: "node-2" },
  },
];

const playTwoItems = [
  {
    type: "person" as const,
    id: "node-9",
    x: 5,
    y: 6,
    size: 24,
  },
];

describe("PlayMakerPlayList", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUsePlayDetails.mockImplementation((_teamId, playId) => {
      if (playId === "play-1") {
        return {
          data: playOneItems,
          isLoading: false,
        } as unknown as ReturnType<typeof usePlayDetails>;
      }

      if (playId === "play-2") {
        return {
          data: playTwoItems,
          isLoading: true,
        } as unknown as ReturnType<typeof usePlayDetails>;
      }

      return {
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof usePlayDetails>;
    });

    mockUseRenderPlayMakerShapes.mockImplementation((shapes) => {
      const summary = shapes
        .map((shape) => {
          const typedShape = shape as TestShape;

          if (typedShape.type === "person") {
            return `person:${typedShape.id}:${typedShape.x}:${typedShape.y}:${typedShape.size}:${typedShape.associatedPlayerId ?? ""}`;
          }

          return `arrow:${typedShape.id}:${typedShape.from?.id}:${typedShape.from?.x}:${typedShape.from?.y}->${typedShape.to?.id}:${typedShape.to?.x}:${typedShape.to?.y}`;
        })
        .join("|");

      return [React.createElement(Text, { key: "summary" }, summary)];
    });
  });

  it("shows the empty state when there are no plays", () => {
    const { getByText } = render(
      <PlayMakerPlayList teamId="team-1" plays={[]} />,
    );

    expect(getByText("No saved plays yet")).toBeTruthy();
  });

  it("renders a play preview and opens edit mode with the play name and play id", async () => {
    const { getByText } = render(
      <PlayMakerPlayList teamId="team-1" plays={["play-1"]} />,
    );

    fireEvent.press(getByText("Play 1"));

    await waitFor(() => {
      expect(
        getByText(
          "person:node-1:10:20:28:player-1|person:node-2:80:90:30:|arrow:arrow-1:node-1:10:20->node-2:80:90",
        ),
      ).toBeTruthy();
    });

    fireEvent.press(getByText("person:node-1:10:20:28:player-1|person:node-2:80:90:30:|arrow:arrow-1:node-1:10:20->node-2:80:90"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/teams/team-1/playmaker/create",
      params: {
        playId: "play-1",
        playName: "Play 1",
      },
    });
  });

  it("shows loading for a selected play while play details are loading", async () => {
    const { getByText } = render(
      <PlayMakerPlayList teamId="team-1" plays={["play-2"]} />,
    );

    fireEvent.press(getByText("Play 1"));

    await waitFor(() => {
      expect(getByText("Loading")).toBeTruthy();
    });
  });

  it("clears the preview when the selected play row is tapped again", async () => {
    const { getByText } = render(
      <PlayMakerPlayList teamId="team-1" plays={["play-1"]} />,
    );

    fireEvent.press(getByText("Play 1"));

    await waitFor(() => {
      expect(
        getByText(
          "person:node-1:10:20:28:player-1|person:node-2:80:90:30:|arrow:arrow-1:node-1:10:20->node-2:80:90",
        ),
      ).toBeTruthy();
    });

    fireEvent.press(getByText("Play 1"));

    await waitFor(() => {
      expect(mockUseRenderPlayMakerShapes).toHaveBeenLastCalledWith(
        [],
        null,
        expect.any(Function),
        expect.any(Function),
      );
    });
  });
});
