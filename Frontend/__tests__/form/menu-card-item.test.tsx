import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { MenuCardItem } from "@/components/form/menu-card-item";
import { MenuPicker } from "@/components/ui/menu-picker";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";

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

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: jest.fn(() => null),
}));

jest.mock("@/contexts/accent-color-context", () => ({
  useAccentColor: jest.fn(() => "#FF9500"),
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
        menu={{
          placeholder: "Select role",
          options,
          value: "Member",
          onValueChange,
          menuTitle: "Choose role",
          disabled: true,
        }}
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

  it("allows the image to be square", () => {
    const tree = render(
      <MenuCardItem
        title="Alex"
        subtitle="alex@example.com"
        image={{ uri: "https://example.com/alex.png" }}
        square={true}
      />,
    );

    expect((BlurView as unknown as jest.Mock).mock.calls[0][0].style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingLeft: 20 }),
        expect.objectContaining({ paddingLeft: 24 }),
      ]),
    );

    expect(tree.toJSON()?.children?.[0]?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gap: 10 }),
        expect.objectContaining({ gap: 16 }),
      ]),
    );

    expect((Image as unknown as jest.Mock).mock.calls[0][0].style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ height: 50, width: 50 }),
        expect.objectContaining({ height: 44, width: 44 }),
        expect.objectContaining({ borderRadius: 0 }),
      ]),
    );
  });

  it("does not render the menu picker when picker props are not passed", () => {
    render(
      <MenuCardItem
        title="Alex"
        subtitle="alex@example.com"
        image={{ uri: "https://example.com/alex.png" }}
      />,
    );

    expect(MenuPicker).not.toHaveBeenCalled();
  });

  it("renders the button action when button props are passed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MenuCardItem
        title="Alex"
        subtitle="alex@example.com"
        image={{ uri: "https://example.com/alex.png" }}
        button={{ label: "Remove", onPress }}
      />,
    );

    fireEvent.press(getByText("Remove"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(MenuPicker).not.toHaveBeenCalled();
  });
});
