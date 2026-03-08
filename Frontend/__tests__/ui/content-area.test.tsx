import React from "react";
import { RefreshControl, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { ContentArea } from "@/components/ui/content-area";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

jest.mock("@/components/ui/background", () => ({
  Background: () => null,
}));

jest.mock("react-native-keyboard-controller", () => {
  const { ScrollView } = jest.requireActual("react-native");
  return {
    KeyboardAwareScrollView: ScrollView,
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
}));

jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ values }: { values: string[] }) => {
    const { Text: RNText } = jest.requireActual("react-native");
    return <RNText testID="tabs">{values.join(",")}</RNText>;
  },
}));

const flattenStyle = (style: unknown) =>
  Array.isArray(style) ? Object.assign({}, ...style) : style;

describe("ContentArea", () => {
  it("renders children", () => {
    const { getByText } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Child content</Text>
      </ContentArea>,
    );

    expect(getByText("Child content")).toBeTruthy();
  });

  it("always renders as KeyboardAwareScrollView", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(UNSAFE_getByType(KeyboardAwareScrollView)).toBeTruthy();
  });

  it("applies automatic content inset adjustment behavior", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Content</Text>
      </ContentArea>,
    );

    const scrollView = UNSAFE_getByType(KeyboardAwareScrollView);

    expect(scrollView.props.contentInsetAdjustmentBehavior).toBe("always");
  });

  it("applies style to the scroll content container", () => {
    const { UNSAFE_getByType } = render(
      <ContentArea
        backgroundProps={{ preset: "blue" }}
        style={{ justifyContent: "space-between", paddingBottom: 50 }}
      >
        <Text>Content</Text>
      </ContentArea>,
    );

    const scrollView = UNSAFE_getByType(KeyboardAwareScrollView);
    const contentContainerStyle = flattenStyle(
      scrollView.props.contentContainerStyle,
    ) as Record<string, unknown>;

    expect(contentContainerStyle.gap).toBe(14);
    expect(contentContainerStyle.paddingHorizontal).toBe(16);
    expect(contentContainerStyle.paddingTop).toBe(8);
    expect(contentContainerStyle.justifyContent).toBe("space-between");
    expect(contentContainerStyle.paddingBottom).toBe(50);
  });

  it("forwards refreshControl", () => {
    const refreshControl = (
      <RefreshControl refreshing={false} onRefresh={() => {}} />
    );

    const { UNSAFE_getByType } = render(
      <ContentArea
        backgroundProps={{ preset: "blue" }}
        refreshControl={refreshControl}
      >
        <Text>Content</Text>
      </ContentArea>,
    );

    const scrollView = UNSAFE_getByType(KeyboardAwareScrollView);

    expect(scrollView.props.refreshControl).toBe(refreshControl);
  });

  it("renders tabs as a fixed overlay when tabs prop is provided", () => {
    const { getByTestId } = render(
      <ContentArea
        backgroundProps={{ preset: "blue" }}
        tabs={{
          values: ["Tab1", "Tab2"],
          selectedIndex: 0,
          onValueChange: () => {},
        }}
      >
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(getByTestId("tabs")).toBeTruthy();
  });

  it("does not render tabs when tabs prop is not provided", () => {
    const { queryByTestId } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(queryByTestId("tabs")).toBeNull();
  });

  it("renders toolbar when toolbar prop is provided", () => {
    const { getByTestId } = render(
      <ContentArea
        backgroundProps={{ preset: "blue" }}
        toolbar={<Text testID="toolbar">Toolbar</Text>}
      >
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(getByTestId("toolbar")).toBeTruthy();
  });

  it("does not render toolbar when toolbar prop is not provided", () => {
    const { queryByTestId } = render(
      <ContentArea backgroundProps={{ preset: "blue" }}>
        <Text>Content</Text>
      </ContentArea>,
    );

    expect(queryByTestId("toolbar")).toBeNull();
  });
});
