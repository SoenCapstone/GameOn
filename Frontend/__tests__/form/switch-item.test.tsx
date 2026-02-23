import React from "react";
import { render } from "@testing-library/react-native";
import { Switch } from "react-native";
import { SwitchItem } from "@/components/form/switch-item";
import { useAccentColor } from "@/contexts/accent-color-context";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...props }: any) =>
      ReactMock.createElement(View, props, children),
  };
});

jest.mock("@/contexts/accent-color-context", () => ({
  useAccentColor: jest.fn(() => "#00AAFF"),
}));

describe("SwitchItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccentColor as jest.Mock).mockReturnValue("#00AAFF");
  });

  it("uses accent-derived trackColor by default", () => {
    const { UNSAFE_getByType } = render(
      <SwitchItem label="Notifications" value={true} onValueChange={jest.fn()} />,
    );

    const toggle = UNSAFE_getByType(Switch);
    expect(toggle.props.trackColor).toEqual({ true: "#00AAFF" });
  });

  it("uses provided trackColor when passed", () => {
    const { UNSAFE_getByType } = render(
      <SwitchItem
        label="Notifications"
        value={false}
        onValueChange={jest.fn()}
        trackColor={{ false: "#333333", true: "#22CC88" }}
      />,
    );

    const toggle = UNSAFE_getByType(Switch);
    expect(toggle.props.trackColor).toEqual({
      false: "#333333",
      true: "#22CC88",
    });
  });
});
