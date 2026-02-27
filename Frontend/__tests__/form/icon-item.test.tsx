import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { IconItem } from "@/components/form/icon-item";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
      BlurView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
        ReactMock.createElement(View, props, children),
  };
});

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
      Image: (props: { [key: string]: unknown }) =>
        ReactMock.createElement(View, { testID: "expo-image", ...props }),
  };
});

describe("IconItem", () => {
  it("renders all icons and updates selected state when an icon is pressed", () => {
    const { UNSAFE_root, toJSON } = render(<IconItem />);
    const pressables = UNSAFE_root.findAll(
      (node: { props: { onPress?: unknown } }) => typeof node.props.onPress === "function",
    );

    expect(pressables).toHaveLength(5);
    const before = toJSON();

    fireEvent.press(pressables[1]);

    const after = toJSON();
    expect(after).not.toEqual(before);
  });
});
