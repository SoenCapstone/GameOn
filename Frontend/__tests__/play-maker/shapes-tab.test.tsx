import { render, fireEvent } from "@testing-library/react-native";
import { ShapesTab } from "../../components/play-maker/shapes-tab";

jest.mock("../../components/play-maker/play-maker-icon/icon-container", () => ({
  IconContainer: () => null,
}));

jest.mock("../../components/play-maker/model", () => ({
  SELECT_SHAPE_BUTTON_CONFIG: [
    { tool: "person", size: 24, xml: "<svg/>" },
    { tool: "arrow", size: 24, xml: "<svg/>" },
  ],
}));

describe("ShapesTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders labels for each tool in the config", () => {
    const onSelectTool = jest.fn();

    const { getByText } = render(
      <ShapesTab selectedTool={"person" as any} onSelectTool={onSelectTool} />
    );

    expect(getByText("person")).toBeTruthy();
    expect(getByText("arrow")).toBeTruthy();
  });

  it("calls onSelectTool(tool) when a tool is pressed", () => {
    const onSelectTool = jest.fn();

    const { getByTestId } = render(
      <ShapesTab selectedTool={"person" as any} onSelectTool={onSelectTool} />
    );

    fireEvent.press(getByTestId("shape-tool-arrow"));

    expect(onSelectTool).toHaveBeenCalledTimes(1);
    expect(onSelectTool).toHaveBeenCalledWith("arrow");
  });
});
