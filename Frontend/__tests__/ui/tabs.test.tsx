import React from "react";
import { StyleSheet, View } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";
import { Tabs } from "@/components/ui/tabs";

jest.mock("expo-glass-effect", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    GlassView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

describe("Tabs", () => {
  it("renders all tab labels", () => {
    const { getByText } = render(
      <Tabs
        values={["Teams", "Leagues", "Tournaments"]}
        selectedIndex={0}
        onValueChange={jest.fn()}
      />,
    );

    expect(getByText("Teams")).toBeTruthy();
    expect(getByText("Leagues")).toBeTruthy();
    expect(getByText("Tournaments")).toBeTruthy();
  });

  it("calls onValueChange when a tab is pressed", () => {
    const onValueChange = jest.fn();
    const { getByText } = render(
      <Tabs
        values={["Teams", "Leagues", "Tournaments"]}
        selectedIndex={0}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.press(getByText("Leagues"));

    expect(onValueChange).toHaveBeenCalledWith("Leagues");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("applies selected and unselected text styles", () => {
    const { getByText } = render(
      <Tabs
        values={["Teams", "Leagues", "Tournaments"]}
        selectedIndex={1}
        onValueChange={jest.fn()}
      />,
    );

    const selectedStyle = StyleSheet.flatten(getByText("Leagues").props.style);
    const unselectedStyle = StyleSheet.flatten(getByText("Teams").props.style);

    expect(selectedStyle.color).toBe("black");
    expect(unselectedStyle.color).toBe("white");
  });

  it("sets selected tab GlassView tintColor to white", () => {
    const { UNSAFE_getAllByType } = render(
      <Tabs
        values={["Teams", "Leagues", "Tournaments"]}
        selectedIndex={2}
        onValueChange={jest.fn()}
      />,
    );

    const glassViews = UNSAFE_getAllByType(View).filter(
      (node) =>
        node.props?.isInteractive === true &&
        Object.hasOwn(node.props, "tintColor"),
    );

    expect(glassViews).toHaveLength(3);
    expect(glassViews[0].props.tintColor).toBeUndefined();
    expect(glassViews[1].props.tintColor).toBeUndefined();
    expect(glassViews[2].props.tintColor).toBe("white");
  });
});
