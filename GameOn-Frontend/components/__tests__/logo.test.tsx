import React from "react";
import { render } from "@testing-library/react-native";
import { Logo } from "@/components/logo";

jest.mock("expo-glass-effect", () => {
  const React = require("react");
  const { View } = require("react-native");
  const GlassView = ({ children, ...props }: any) =>
    React.createElement(View, props, children);
  return { GlassView };
});

jest.mock("expo-image", () => {
  const React = require("react");
  const { Image } = require("react-native");
  const ExpoImage = (props: any) => React.createElement(Image, props);
  return { Image: ExpoImage };
});

describe("Logo", () => {
  it("renders without crashing", () => {
    const { toJSON } = render(<Logo />);
    expect(toJSON()).toBeTruthy();
  });

  it("matches snapshot", () => {
    const { toJSON } = render(<Logo />);
    expect(toJSON()).toMatchSnapshot();
  });
});
