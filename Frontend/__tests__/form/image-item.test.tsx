import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ImageItem } from "@/components/form/image-item";
import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";

jest.mock("expo-glass-effect", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    GlassView: jest.fn(({ children, ...props }: any) =>
      ReactMock.createElement(View, props, children),
    ),
  };
});

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    Image: jest.fn((props: any) =>
      ReactMock.createElement(View, { testID: "expo-image", ...props }),
    ),
  };
});

describe("ImageItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("wires GlassView props and press behavior", () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(
      <ImageItem image={{ uri: "https://example.com/pic.png" }} onPress={onPress} />,
    );

    const glassCall = (GlassView as jest.Mock).mock.calls[0][0];
    expect(glassCall.isInteractive).toBe(true);

    const imageCall = (Image as jest.Mock).mock.calls[0][0];
    expect(imageCall.style.width).toBe(160);
    expect(imageCall.style.height).toBe(160);

    const pressable = UNSAFE_root.find(
      (node) => typeof node.props.onPress === "function",
    );
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("uses logo image sizing when logo is true", () => {
    render(<ImageItem image={{ uri: "https://example.com/logo.png" }} logo={true} />);

    const imageCall = (Image as jest.Mock).mock.calls[0][0];
    expect(imageCall.style.width).toBe(110);
    expect(imageCall.style.height).toBe(110);
  });
});
