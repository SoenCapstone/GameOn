import React from "react";
import { View, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { ContentArea } from "@/components/ui/content-area";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

const mockUseHeaderHeight = jest.fn();
const mockUseSafeAreaInsets = jest.fn();

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => mockUseHeaderHeight(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => mockUseSafeAreaInsets(),
}));

jest.mock("@/components/ui/background", () => ({
  Background: () => null,
}));

jest.mock("react-native-keyboard-controller", () => {
  const { ScrollView } = jest.requireActual("react-native");
  return {
    KeyboardAwareScrollView: ScrollView,
  };
});

describe("ContentArea", () => {
  beforeEach(() => {
    mockUseHeaderHeight.mockReturnValue(100);
    mockUseSafeAreaInsets.mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });
  });

  it("renders children", () => {
    const { getByText } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Child content</Text>
      </ContentArea>,
    );

    expect(getByText("Child content")).toBeTruthy();
  });

  it("applies numeric padding based on header height + 8", () => {
    mockUseHeaderHeight.mockReturnValue(100);
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <></>
      </ContentArea>,
    );

    const view = UNSAFE_getByType(View);
    const style = Array.isArray(view.props.style)
      ? Object.assign({}, ...view.props.style)
      : view.props.style;

    expect(typeof style.paddingTop).toBe("number");
    expect(Number.isFinite(style.paddingTop)).toBe(true);
    expect(style.paddingTop).toBe(108); // headerHeight (100) + 8

    expect(style.flex).toBe(1);
    expect(style.paddingHorizontal).toBe(16);
  });

  it("renders as View by default when scrollable is not set", () => {
    const { UNSAFE_queryByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(UNSAFE_queryByType(KeyboardAwareScrollView)).toBeFalsy();
  });

  it("renders as KeyboardAwareScrollView when scrollable is true", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }} scrollable={true}>
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(UNSAFE_getByType(KeyboardAwareScrollView)).toBeTruthy();
  });

  it("applies contentContainerStyle with paddingBottom and gap for KeyboardAwareScrollView", () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });

    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }} scrollable={true}>
        <Text>Content</Text>
      </ContentArea>,
    );

    const scrollView = UNSAFE_getByType(KeyboardAwareScrollView);
    const contentContainerStyle = scrollView.props.contentContainerStyle;

    expect(contentContainerStyle.paddingBottom).toBe(34); // insets.bottom (34) + paddingBottom (0, default)
    expect(contentContainerStyle.gap).toBe(14);
  });

  it("applies custom paddingBottom when provided", () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });

    const { UNSAFE_getByType } = render(
      <ContentArea
        backgroundProps={{ preset: "blue" }}
        scrollable={true}
        paddingBottom={50}
      >
        <Text>Content</Text>
      </ContentArea>,
    );

    const scrollView = UNSAFE_getByType(KeyboardAwareScrollView);
    const contentContainerStyle = scrollView.props.contentContainerStyle;

    expect(contentContainerStyle.paddingBottom).toBe(84); // insets.bottom (34) + paddingBottom (50)
    expect(contentContainerStyle.gap).toBe(14);
  });

  it("applies stickyHeaderIndices when tabs is true", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }} tabs={true}>
        <Text>Content</Text>
      </ContentArea>,
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.stickyHeaderIndices).toEqual([0]);
  });

  it("does not apply stickyHeaderIndices when tabs is false", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }} tabs={false}>
        <Text>Content</Text>
      </ContentArea>,
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.stickyHeaderIndices).toBeUndefined();
  });

  it("does not apply stickyHeaderIndices when tabs is not set", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Content</Text>
      </ContentArea>,
    );

    const view = UNSAFE_getByType(View);
    expect(view.props.stickyHeaderIndices).toBeUndefined();
  });
});
