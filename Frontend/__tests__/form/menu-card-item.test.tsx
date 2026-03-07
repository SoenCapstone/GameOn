import React from "react";
import { render } from "@testing-library/react-native";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { MenuPicker } from "@/components/ui/menu-picker";
import { Image } from "expo-image";

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
        [_key: string]: unknown;
      }) => ReactMock.createElement(View, props, children),
    ),
  };
});

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Image: jest.fn((props: { [_key: string]: unknown }) =>
      ReactMock.createElement(View, { testID: "expo-image", ...props }),
    ),
  };
});

jest.mock("@/components/ui/menu-picker", () => ({
  MenuPicker: jest.fn(() => null),
}));

describe("MenuCardItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title/subtitle and forwards picker props", () => {
    const onValueChange = jest.fn();
    const options = ["Member", "Admin"] as const;
    render(
      <MenuCardItem
        title="Alex"
        subtitle="alex@example.com"
        image={{ uri: "https://example.com/alex.png" }}
        placeholder="Select role"
        options={options}
        value="Member"
        onValueChange={onValueChange}
        menuTitle="Choose role"
        disabled={true}
      />,
    );

    expect((Image as unknown as jest.Mock).mock.calls[0][0].source).toEqual({
      uri: "https://example.com/alex.png",
    });

    const menuCall = (MenuPicker as jest.Mock).mock.calls[0][0];
    expect(menuCall.title).toBe("Choose role");
    expect(menuCall.placeholder).toBe("Select role");
    expect(menuCall.options).toEqual(options);
    expect(menuCall.value).toBe("Member");
    expect(menuCall.onValueChange).toBe(onValueChange);
    expect(menuCall.disabled).toBe(true);
  });
});
