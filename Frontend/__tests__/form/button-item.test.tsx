import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ButtonItem } from "@/components/form/button-item";
import { useAccentColor } from "@/contexts/accent-color-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
      BlurView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        ReactMock.createElement(View, props, children),
  };
});

jest.mock("@/contexts/accent-color-context", () => ({
  useAccentColor: jest.fn(() => "#00AAFF"),
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: jest.fn(() => null),
}));

describe("ButtonItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccentColor as jest.Mock).mockReturnValue("#00AAFF");
  });

  it("renders label/button and uses accent color by default", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ButtonItem label="Action" button="Save" onPress={onPress} />,
    );

    expect(getByText("Action")).toBeTruthy();
    const button = getByText("Save");
    expect(button.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: "#00AAFF" })]),
    );
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders icon variant with explicit color", () => {
    render(
      <ButtonItem icon="star.fill" color="#FF5500" onPress={jest.fn()} />,
    );

    const call = (IconSymbol as jest.Mock).mock.calls[0][0];
    expect(call.name).toBe("star.fill");
    expect(call.color).toBe("#FF5500");
    expect(call.size).toBe(24);
  });
});
