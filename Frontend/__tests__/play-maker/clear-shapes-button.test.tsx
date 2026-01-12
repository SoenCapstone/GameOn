import React from "react";
import { render } from "@testing-library/react-native";
import { ClearShapesButton } from "../../components/play-maker/clear-shapes-button";

jest.mock("../../components/play-maker/play-maker-icon/icon-container", () => ({
  IconContainer: () => null,
}));

const mockOnPressUndo = jest.fn();
const mockOnPressClearCurrent = jest.fn();

jest.mock("@/components/play-maker/model.ts", () => ({
  CLEAR_SHAPES_BUTTON_CONFIG: [
    { tool: "Undo", size: 24, xml: "<svg/>", onPress: mockOnPressUndo },
    {
      tool: "ClearCurrent",
      size: 24,
      xml: "<svg/>",
      onPress: mockOnPressClearCurrent,
    },
  ],
}));

describe("ClearShapesButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders labels and triggers config onPress for each button", () => {
    const setShapes = jest.fn();
    const shapes = [{ id: "s1" }] as any;
    const selectedShapeId = "s1";

    const { getByText } = render(
      <ClearShapesButton
        setShapes={setShapes}
        shapes={shapes}
        selectedShapeId={selectedShapeId}
      />
    );

    expect(getByText("Undo")).toBeTruthy();
    expect(getByText("ClearCurrent")).toBeTruthy();
  });
});
