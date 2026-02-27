import React from "react";
import { Text } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { PlayMakerBoard } from "@/components/play-maker/play-maker-board";

jest.mock(
  "@/components/play-maker/play-maker-board-configurations/play-maker-default-board",
  () => ({
    DefaultBoard: ({ children }: { children?: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

describe("PlayMakerBoard", () => {
  it("renders children", () => {
    const { getByText } = render(
      <PlayMakerBoard
        boardConfig={undefined}
        selectedTool={"person"}
        selectedShapeId={null}
      >
        <Text>Child</Text>
      </PlayMakerBoard>,
    );

    expect(getByText("Child")).toBeTruthy();
  });

  it("calls onBoardPress with locationX/locationY when pressed", () => {
    const onBoardPress = jest.fn();

    const { getByTestId } = render(
      <PlayMakerBoard
        onBoardPress={onBoardPress}
        boardConfig={undefined}
        selectedTool={"person"}
        selectedShapeId={null}
      >
        <Text>Child</Text>
      </PlayMakerBoard>,
    );

    fireEvent.press(getByTestId("playmaker-board-pressable"), {
      nativeEvent: { locationX: 12, locationY: 34 },
    });

    expect(onBoardPress).toHaveBeenCalledTimes(1);
    expect(onBoardPress).toHaveBeenCalledWith({ x: 12, y: 34 });
  });

  it("does nothing if onBoardPress is not provided", () => {
    const { getByTestId } = render(
      <PlayMakerBoard
        boardConfig={undefined}
        selectedTool={"person"}
        selectedShapeId={null}
      >
        <Text>Child</Text>
      </PlayMakerBoard>,
    );

    fireEvent.press(getByTestId("playmaker-board-pressable"), {
      nativeEvent: { locationX: 1, locationY: 2 },
    });
  });
});
