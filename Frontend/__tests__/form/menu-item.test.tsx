import React from "react";
import { render } from "@testing-library/react-native";
import { MenuItem } from "@/components/form/menu-item";
import { MenuPicker } from "@/components/ui/menu-picker";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    BlurView: jest.fn(
      ({
        children,
        ...props
      }: {
        children?: React.ReactNode;
        [key: string]: unknown;
      }) => ReactMock.createElement(View, props, children),
    ),
  };
});

jest.mock("@/components/ui/menu-picker", () => ({
  MenuPicker: jest.fn(() => null),
}));

describe("MenuItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards menu picker props and defaults disabled to false", () => {
    const onValueChange = jest.fn();
    render(
      <MenuItem
        label="Role"
        title="Team role"
        options={["Owner", "Member"]}
        value="Owner"
        onValueChange={onValueChange}
      />,
    );

    const call = (MenuPicker as jest.Mock).mock.calls[0][0];
    expect(call.title).toBe("Team role");
    expect(call.options).toEqual(["Owner", "Member"]);
    expect(call.value).toBe("Owner");
    expect(call.onValueChange).toBe(onValueChange);
    expect(call.disabled).toBe(false);
  });

  it("passes disabled flag when explicitly set", () => {
    render(
      <MenuItem
        label="Role"
        options={["Owner", "Member"]}
        value="Member"
        onValueChange={jest.fn()}
        disabled={true}
      />,
    );

    const call = (MenuPicker as jest.Mock).mock.calls[0][0];
    expect(call.disabled).toBe(true);
  });
});
