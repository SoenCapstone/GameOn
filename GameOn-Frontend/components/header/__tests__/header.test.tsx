import React from "react";
import { render } from "@testing-library/react-native";
import { Header } from "@/components/header/header";
import { Text } from "react-native";

describe("Header component", () => {
  it("renders center content correctly", () => {
    const { getByText } = render(<Header center={<Text>Center</Text>} />);
    expect(getByText("Center")).toBeTruthy();
  });

  it("renders left content when provided", () => {
    const { getByText } = render(
      <Header left={<Text>Left</Text>} center={<Text>Center</Text>} />,
    );
    expect(getByText("Left")).toBeTruthy();
  });

  it("renders right content when provided", () => {
    const { getByText } = render(
      <Header right={<Text>Right</Text>} center={<Text>Center</Text>} />,
    );
    expect(getByText("Right")).toBeTruthy();
  });

  it("renders all three sections correctly", () => {
    const { getByText } = render(
      <Header
        left={<Text>Left</Text>}
        center={<Text>Center</Text>}
        right={<Text>Right</Text>}
      />,
    );
    expect(getByText("Left")).toBeTruthy();
    expect(getByText("Center")).toBeTruthy();
    expect(getByText("Right")).toBeTruthy();
  });
});
