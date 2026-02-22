import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { InputItem } from "@/components/form/input-item";

jest.mock("expo-blur", () => {
  const ReactMock = jest.requireActual("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...props }: any) =>
      ReactMock.createElement(View, props, children),
  };
});

describe("InputItem", () => {
  it("renders label and triggers onChangeText", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <InputItem
        label="Name"
        value=""
        placeholder="Enter name"
        onChangeText={onChangeText}
      />,
    );

    expect(getByText("Name")).toBeTruthy();
    fireEvent.changeText(getByPlaceholderText("Enter name"), "Falcons");
    expect(onChangeText).toHaveBeenCalledWith("Falcons");
  });
});
