import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { TextAreaItem } from "@/components/form/text-area-item";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    BlurView: jest.fn(({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) =>
      ReactMock.createElement(View, props, children),
    ),
  };
});

describe("TextAreaItem", () => {
  it("forces multiline top-aligned input and forwards text changes", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <TextAreaItem placeholder="About team" onChangeText={onChangeText} />,
    );

    const input = getByPlaceholderText("About team");
    expect(input.props.multiline).toBe(true);
    expect(input.props.textAlignVertical).toBe("top");
    fireEvent.changeText(input, "Practice on Tuesdays");
    expect(onChangeText).toHaveBeenCalledWith("Practice on Tuesdays");
  });
});
