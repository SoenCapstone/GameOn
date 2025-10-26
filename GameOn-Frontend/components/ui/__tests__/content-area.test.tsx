import React from "react";
import { View, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { ContentArea } from "@/components/ui/content-area";

const mockUseHeaderHeight = jest.fn();

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => mockUseHeaderHeight(),
}));

describe("ContentArea", () => {
  it("renders children", () => {
    mockUseHeaderHeight.mockReturnValue(20);
    const { getByText } = render(
      <ContentArea>
        <Text>Child content</Text>
      </ContentArea>,
    );

    expect(getByText("Child content")).toBeTruthy();
  });

  it("applies numeric padding based on header height", () => {
    mockUseHeaderHeight.mockReturnValue(30);
    const { UNSAFE_getByType } = render(
      <ContentArea>
        <></>
      </ContentArea>,
    );

    const view = UNSAFE_getByType(View);
    const style = Array.isArray(view.props.style)
      ? Object.assign({}, ...view.props.style)
      : view.props.style;

    expect(typeof style.paddingTop).toBe("number");
    expect(Number.isFinite(style.paddingTop)).toBe(true);

    expect(style.flex).toBe(1);
    expect(style.paddingHorizontal).toBe(16);
    expect(style.rowGap).toBe(14);
  });
});
