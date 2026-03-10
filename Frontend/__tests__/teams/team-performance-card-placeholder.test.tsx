import React from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import { render } from "@testing-library/react-native";
import { TeamPerformanceCardPlaceholder } from "@/components/teams/team-performance-card-placeholder";

jest.mock("@/components/ui/card", () => {
  const mockReact = jest.requireActual("react");
  const mockView = jest.requireActual("react-native").View;

  return {
    Card: ({ children }: { children?: React.ReactNode }) =>
      mockReact.createElement(mockView, { testID: "card" }, children),
  };
});

function getFillWidths(root: ReturnType<typeof render>) {
  const widths: string[] = [];

  const visit = (node: unknown) => {
    if (!node || Array.isArray(node) || typeof node !== "object") {
      if (Array.isArray(node)) {
        node.forEach(visit);
      }
      return;
    }

    const candidate = node as {
      props?: { style?: unknown };
      children?: unknown[];
    };
    const flatStyle = StyleSheet.flatten(candidate.props?.style) as
      | ViewStyle
      | undefined;

    if (flatStyle?.height === "100%" && typeof flatStyle.width === "string") {
      widths.push(flatStyle.width);
    }

    candidate.children?.forEach(visit);
  };

  visit(root.toJSON());
  return widths;
}

describe("TeamPerformanceCardPlaceholder", () => {
  it("renders placeholder bars and footer skeleton when performance is missing", () => {
    const screen = render(
      <TeamPerformanceCardPlaceholder performance={undefined} />,
    );

    expect(screen.getByTestId("card")).toBeTruthy();
    expect(screen.getByText("Team Performance")).toBeTruthy();
    expect(screen.getByText("OFF")).toBeTruthy();
    expect(screen.getByText("DEF")).toBeTruthy();
    expect(screen.getByText("DIS")).toBeTruthy();
    expect(screen.getByText("INF")).toBeTruthy();
    expect(screen.queryByText("NaN")).toBeNull();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("100")).toBeNull();
    expect(getFillWidths(screen)).toEqual(["55%", "55%", "55%"]);
  });

  it("renders clamped values for NaN, negative, overflow, and normal percentages", () => {
    const screen = render(
      <TeamPerformanceCardPlaceholder
        performance={{
          off: Number.NaN,
          def: -10,
          dis: 150,
          inf: 4,
        }}
      />,
    );

    expect(screen.getByText("NaN")).toBeTruthy();
    expect(screen.getByText("-10")).toBeTruthy();
    expect(screen.getByText("150")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(getFillWidths(screen)).toEqual(["0%", "0%", "100%"]);

    screen.rerender(
      <TeamPerformanceCardPlaceholder
        performance={{
          off: 33,
          def: 0,
          dis: 100,
          inf: 9,
        }}
      />,
    );

    expect(screen.getByText("33")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("9")).toBeTruthy();
    expect(getFillWidths(screen)).toEqual(["33%", "0%", "100%"]);
  });
});
