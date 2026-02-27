import React from "react";
import { render } from "@testing-library/react-native";
import { Logo } from "@/components/header/logo";

jest.mock("expo-glass-effect", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  const GlassView = ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => React.createElement(View, props, children);
  return { GlassView };
});

jest.mock("expo-image", () => {
  const React = jest.requireActual("react");
  const { Image } = jest.requireActual("react-native");
  const ExpoImage = (props: { [key: string]: unknown }) =>
    React.createElement(Image, props);
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
