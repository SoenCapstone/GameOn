import React from "react";
import { render } from "@testing-library/react-native";
import { Background } from "@/components/background";

jest.mock("expo-linear-gradient", () => {
  const MockLinearGradient = (props: any) => <>{props.children}</>;
  return { LinearGradient: MockLinearGradient };
});

describe("Background component", () => {
  it("renders with a preset color", () => {
    const { toJSON } = render(<Background preset="blue" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders with a custom color", () => {
    const { toJSON } = render(<Background color="#FF0000" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("applies the correct gradient locations for default mode", () => {
    render(<Background preset="blue" mode="default" />);
  });

  it("applies the correct gradient locations for form mode", () => {
    render(<Background preset="purple" mode="form" />);
  });

  it("uses default color when neither preset nor color are provided", () => {
    render(<Background preset="blue" />);
  });
});
