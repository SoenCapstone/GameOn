import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { ProfileItem } from "@/components/form/profile-item";
import { BlurView } from "expo-blur";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    BlurView: jest.fn(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactMock.createElement(View, props, children),
    ),
  };
});

jest.mock("expo-image", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Image: jest.fn((props: { [key: string]: unknown }) =>
      ReactMock.createElement(View, { testID: "expo-image", ...props }),
    ),
  };
});

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: jest.fn(() => null),
}));

describe("ProfileItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders subtitle, handles press, and uses nested blur when logo is false", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ProfileItem
        title="Warriors"
        subtitle="California"
        image={{ uri: "https://example.com/team.png" }}
        onPress={onPress}
      />,
    );

    expect(getByText("Warriors")).toBeTruthy();
    expect(getByText("California")).toBeTruthy();
    fireEvent.press(getByText("Warriors"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect((BlurView as jest.Mock).mock.calls.length).toBe(2);
  });

  it("skips nested blur when logo is true", () => {
    const { queryByText } = render(
      <ProfileItem
        title="League Logo"
        image={{ uri: "https://example.com/logo.png" }}
        logo={true}
        onPress={jest.fn()}
      />,
    );

    expect(queryByText("California")).toBeNull();
    expect((BlurView as jest.Mock).mock.calls.length).toBe(1);
  });
});
