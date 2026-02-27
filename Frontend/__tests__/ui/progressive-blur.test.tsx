import React from "react";
import { render } from "@testing-library/react-native";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

jest.mock("@react-native-masked-view/masked-view", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return jest.fn(({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
    ReactMock.createElement(View, props, children),
  );
});

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    BlurView: jest.fn((props: Record<string, unknown>) =>
      ReactMock.createElement(View, { testID: "blur-view", ...props }),
    ),
  };
});

jest.mock("expo-linear-gradient", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    LinearGradient: jest.fn((props: Record<string, unknown>) =>
      ReactMock.createElement(View, { testID: "linear-gradient", ...props }),
    ),
  };
});

describe("ProgressiveBlur", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default height and expected blur layers", () => {
    const { UNSAFE_getByProps } = render(<ProgressiveBlur />);

    const container = UNSAFE_getByProps({ pointerEvents: "none" });
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 100 })]),
    );

    const maskedCall = (MaskedView as unknown as jest.Mock).mock.calls[0][0];
    expect(maskedCall.maskElement).toBeTruthy();
    expect(maskedCall.maskElement.props.locations).toEqual([0, 0.5, 1]);

    const blurCall = (BlurView as jest.Mock).mock.calls[0][0];
    expect(blurCall.intensity).toBe(40);
    expect(blurCall.tint).toBe("dark");

    expect((LinearGradient as jest.Mock).mock.calls.length).toBe(1);
    expect((LinearGradient as jest.Mock).mock.calls[0][0].colors).toEqual([
      "rgba(0,0,0,0.3)",
      "rgba(0,0,0,0.85)",
    ]);
  });

  it("respects custom height", () => {
    const { UNSAFE_getByProps } = render(<ProgressiveBlur height={180} />);
    const container = UNSAFE_getByProps({ pointerEvents: "none" });
    expect(container.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ height: 180 })]),
    );
  });
});
