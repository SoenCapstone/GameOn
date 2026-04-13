import React from "react";
import { render } from "@testing-library/react-native";
import { Callout } from "@/components/maps/callout";
import { GlassView } from "expo-glass-effect";
import * as ReactNativeMaps from "react-native-maps";

jest.mock("react-native-maps", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Callout: jest.fn(({ children }: { children?: React.ReactNode }) =>
      ReactMock.createElement(View, { testID: "map-callout" }, children),
    ),
  };
});

jest.mock("expo-glass-effect", () => ({
  GlassView: jest.fn(({ children }) => children),
}));

describe("maps/Callout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders name and detail with expected Text limits", () => {
    const { getByText } = render(
      <Callout name="Central Arena" detail="1 Main St, Town, ON" />,
    );

    expect(getByText("Central Arena").props.numberOfLines).toBe(2);
    expect(getByText("1 Main St, Town, ON").props.numberOfLines).toBe(3);
  });

  it("passes tooltip to react-native-maps Callout", () => {
    render(<Callout name="A" detail="B" />);

    const MapCallout = ReactNativeMaps.Callout as jest.Mock;
    expect(MapCallout).toHaveBeenCalledTimes(1);
    expect(MapCallout.mock.calls[0][0].tooltip).toBe(true);
  });

  it("wires GlassView for non-interactive glass chrome", () => {
    render(<Callout name="A" detail="B" />);

    const glassCall = (GlassView as jest.Mock).mock.calls[0][0];
    expect(glassCall.isInteractive).toBe(false);
    expect(glassCall.style).toMatchObject({
      maxWidth: 280,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 22,
      borderCurve: "continuous",
      gap: 4,
    });
  });
});
