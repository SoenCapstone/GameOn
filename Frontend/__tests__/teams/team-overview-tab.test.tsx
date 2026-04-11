import React from "react";
import { ActivityIndicator } from "react-native";
import { render } from "@testing-library/react-native";
import { TeamOverviewTab } from "@/components/teams/team-overview-tab";
import type { TeamOverviewResponse } from "@/hooks/use-team-overview";
import { errorToString } from "@/utils/error";

jest.mock("@/components/ui/card", () => {
  const mockReact = jest.requireActual("react");
  const mockView = jest.requireActual("react-native").View;

  return {
    Card: ({ children }: { children?: React.ReactNode }) =>
      mockReact.createElement(mockView, { testID: "card" }, children),
  };
});

jest.mock("@/utils/error", () => ({
  errorToString: jest.fn(),
}));

jest.mock("@/components/teams/team-performance-card-placeholder", () => {
  const mockReact = jest.requireActual("react");
  const mockText = jest.requireActual("react-native").Text;

  return {
    TeamPerformanceCardPlaceholder: ({
      performance,
    }: {
      performance?: {
        off?: number;
        def?: number;
        dis?: number;
        inf?: number;
      };
    }) =>
      mockReact.createElement(
        mockText,
        { testID: "performance-placeholder" },
        JSON.stringify(performance ?? null),
      ),
  };
});

const mockedErrorToString = jest.mocked(errorToString);

describe("TeamOverviewTab", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedErrorToString.mockReturnValue("formatted error");
  });

  it("renders populated overview data", () => {
    const overview: TeamOverviewResponse = {
      seasonLabel: "Season Alpha",
      record: "14-2-1",
      tiles: [
        { key: "points", label: "🏆 Points", value: 42 },
        { key: "matches", label: "📅 Matches", value: 18 },
        { key: "streak", label: "🔥 Streak", value: "W4" },
        { key: "minutes", label: "⏱ Minutes", value: 960 },
      ],
      rosterCounts: {
        total: 16,
        owner: 1,
        manager: 2,
        players: 13,
      },
      performance: {
        off: 81,
        def: 75,
        dis: 68,
        inf: 7,
      },
    };

    const {
      getAllByTestId,
      getByTestId,
      getByText,
      queryByText,
      UNSAFE_queryByType,
    } = render(
      <TeamOverviewTab
        overviewLoading={false}
        overviewError={null}
        overview={overview}
        tiles={overview.tiles}
      />,
    );

    expect(getAllByTestId("card")).toHaveLength(2);
    expect(getByText("Season Alpha")).toBeTruthy();
    expect(getByText("14-2-1")).toBeTruthy();
    expect(getByText("42")).toBeTruthy();
    expect(getByText("18")).toBeTruthy();
    expect(getByText("W4")).toBeTruthy();
    expect(getByText("960")).toBeTruthy();
    expect(getByText("Points")).toBeTruthy();
    expect(getByText("Matches")).toBeTruthy();
    expect(getByText("Streak")).toBeTruthy();
    expect(getByText("Minutes")).toBeTruthy();
    expect(getByText("Roster")).toBeTruthy();
    expect(getByText("Total")).toBeTruthy();
    expect(getByText("16")).toBeTruthy();
    expect(getByText("Owner")).toBeTruthy();
    expect(getByText("1")).toBeTruthy();
    expect(getByText("Manager")).toBeTruthy();
    expect(getByText("2")).toBeTruthy();
    expect(getByText("Players")).toBeTruthy();
    expect(getByText("13")).toBeTruthy();
    expect(getByTestId("performance-placeholder").props.children).toBe(
      JSON.stringify(overview.performance),
    );
    expect(queryByText("formatted error")).toBeNull();
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  });

  it("renders loading, error, and fallback states when overview values are missing", () => {
    const overviewError = new Error("network failed");
    const tiles: TeamOverviewResponse["tiles"] = [
      { key: "points", label: "🏆 Points", value: undefined },
      { key: "matches", label: "📅 Matches", value: undefined },
      { key: "streak", label: "🔥 Streak", value: undefined },
      { key: "minutes", label: "⏱ Minutes", value: undefined },
    ];

    const { getByTestId, getByText, queryByText, UNSAFE_getByType } = render(
      <TeamOverviewTab
        overviewLoading={true}
        overviewError={overviewError}
        overview={undefined}
        tiles={tiles}
      />,
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(mockedErrorToString).toHaveBeenCalledWith(overviewError);
    expect(getByText("formatted error")).toBeTruthy();
    expect(getByText(`Season ${new Date().getFullYear()}`)).toBeTruthy();
    expect(getByText("Points")).toBeTruthy();
    expect(getByText("Matches")).toBeTruthy();
    expect(getByText("Streak")).toBeTruthy();
    expect(getByText("Minutes")).toBeTruthy();
    expect(getByText("Roster")).toBeTruthy();
    expect(getByText("Owner")).toBeTruthy();
    expect(getByText("Manager")).toBeTruthy();
    expect(getByText("Players")).toBeTruthy();
    expect(queryByText("14-2-1")).toBeNull();
    expect(queryByText("16")).toBeNull();
    expect(getByTestId("performance-placeholder").props.children).toBe("null");
  });
});
