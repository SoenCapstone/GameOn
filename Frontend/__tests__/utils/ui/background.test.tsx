import React from "react";
import { render } from "@testing-library/react-native";
import { Background } from "@/components/ui/background";
import { Colors } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";

jest.mock("expo-linear-gradient");

const MockedLinearGradient = LinearGradient as jest.Mock;

describe("Background component", () => {
  beforeEach(() => {
    MockedLinearGradient.mockClear();
  });

  it("renders with a preset color", () => {
    render(<Background preset="red" />);

    expect(MockedLinearGradient).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: [Colors.red, "#00000080"],
      }),
      {},
    );
  });

  it("renders with a custom color", () => {
    const customColor = "#FF00FF";
    render(<Background color={customColor} />);

    expect(MockedLinearGradient).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: [customColor, "#00000080"],
      }),
      {},
    );
  });

  it("applies the correct gradient locations for default mode", () => {
    render(<Background preset="blue" mode="default" />);

    expect(MockedLinearGradient).toHaveBeenCalledWith(
      expect.objectContaining({
        locations: [0, 0.8],
      }),
      {},
    );
  });

  it("applies the correct gradient locations for form mode", () => {
    render(<Background preset="purple" mode="form" />);

    expect(MockedLinearGradient).toHaveBeenCalledWith(
      expect.objectContaining({
        locations: [0, 0.3],
      }),
      {},
    );
  });

  it("uses the default color (blue) when neither preset nor color are provided", () => {
    const UntypedBackground = Background as any;
    render(<UntypedBackground />);

    expect(MockedLinearGradient).toHaveBeenCalledWith(
      expect.objectContaining({
        colors: [Colors.blue, "#00000080"],
      }),
      {},
    );
  });
});
