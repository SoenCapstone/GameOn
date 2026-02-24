import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { MultiselectItem } from "@/components/form/multiselect-item";
import { useAccentColor } from "@/contexts/accent-color-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    BlurView: ({ children, ...props }: any) =>
      ReactMock.createElement(View, props, children),
  };
});

jest.mock("@/contexts/accent-color-context", () => ({
  useAccentColor: jest.fn(() => "#00AAFF"),
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: jest.fn(() => null),
}));

describe("MultiselectItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccentColor as jest.Mock).mockReturnValue("#00AAFF");
  });

  it("renders options and selected/unselected icons", () => {
    const { getByText } = render(
      <MultiselectItem
        options={["One", "Two"]}
        selected={["Two"]}
        onSelected={jest.fn()}
        color="#FF00AA"
      />,
    );

    expect(getByText("One")).toBeTruthy();
    expect(getByText("Two")).toBeTruthy();

    const calls = (IconSymbol as jest.Mock).mock.calls.map((call) => call[0]);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "checkmark.circle.fill",
          color: "#FF00AA",
          size: 24,
        }),
        expect.objectContaining({ name: "circle", color: "#8C8C8C", size: 24 }),
      ]),
    );
  });

  it("uses accent color when color is not provided", () => {
    render(
      <MultiselectItem
        options={["One"]}
        selected={["One"]}
        onSelected={jest.fn()}
      />,
    );

    const calls = (IconSymbol as jest.Mock).mock.calls.map((call) => call[0]);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "checkmark.circle.fill",
          color: "#00AAFF",
          size: 24,
        }),
      ]),
    );
  });

  it("toggles selection and calls onSelected", () => {
    const onSelected = jest.fn();
    const { getByText } = render(
      <MultiselectItem
        options={["One", "Two"]}
        selected={["One"]}
        onSelected={onSelected}
      />,
    );

    fireEvent.press(getByText("One"));
    fireEvent.press(getByText("Two"));

    expect(onSelected).toHaveBeenCalledTimes(2);
    expect(onSelected).toHaveBeenNthCalledWith(1, []);
    expect(onSelected).toHaveBeenNthCalledWith(2, ["One", "Two"]);
  });
});
