import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ColorItem } from "@/components/form/color-item";
import { ColorPicker } from "@expo/ui/swift-ui";
import * as runtime from "@/utils/runtime";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...props }: any) =>
      ReactMock.createElement(View, props, children),
  };
});

jest.mock("@expo/ui/swift-ui", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    Host: ({ children, ...props }: any) =>
      ReactMock.createElement(View, props, children),
    ColorPicker: jest.fn((props: any) =>
      ReactMock.createElement(View, { testID: "color-picker", ...props }),
    ),
  };
});

jest.mock("@/utils/runtime", () => {
  let expoGo = true;
  return {
    get isRunningInExpoGo() {
      return expoGo;
    },
    __setExpoGo: (value: boolean) => {
      expoGo = value;
    },
  };
});

const runtimeAny = runtime as any;

describe("ColorItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runtimeAny.__setExpoGo(true);
  });

  it("renders TextInput branch in Expo Go", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ColorItem label="Color" value="#123456" onChangeText={onChangeText} />,
    );

    expect(getByText("Color")).toBeTruthy();
    const input = getByPlaceholderText("#FF0000");
    fireEvent.changeText(input, "#654321");
    expect(onChangeText).toHaveBeenCalledWith("#654321");
    expect((ColorPicker as jest.Mock).mock.calls.length).toBe(0);
  });

  it("renders ColorPicker branch outside Expo Go", () => {
    runtimeAny.__setExpoGo(false);
    render(<ColorItem {...({ label: "Color", value: "#00FF00" } as any)} />);

    const call = (ColorPicker as jest.Mock).mock.calls[0][0];
    expect(call.value).toBe("#00FF00");
    expect(call.supportsOpacity).toBe(false);
  });
});
