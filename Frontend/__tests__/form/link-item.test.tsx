import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { LinkItem } from "@/components/form/link-item";
import { IconSymbol } from "@/components/ui/icon-symbol";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    BlurView: jest.fn(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactMock.createElement(View, props, children),
    ),
  };
});

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: jest.fn(() => null),
}));

describe("LinkItem", () => {
  it("renders label and chevron icon and handles press", () => {
    const onPress = jest.fn();
    const { getByText } = render(<LinkItem label="Open details" onPress={onPress} />);

    fireEvent.press(getByText("Open details"));
    expect(onPress).toHaveBeenCalledTimes(1);

    const call = (IconSymbol as jest.Mock).mock.calls[0][0];
    expect(call.name).toBe("chevron.right");
    expect(call.color).toBe("#8C8C8C");
    expect(call.size).toBe(16);
  });
});
