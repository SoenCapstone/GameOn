import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";
import { SearchResultsScreen } from "@/components/search/search-results-screen";
import { createScopedLog } from "@/utils/logger";
import type { SearchResult, SearchValue } from "@/constants/search";
import { router } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock("@/components/info-card", () => {
  const mockReact = jest.requireActual("react");
  const mockTouchableOpacity =
    jest.requireActual("react-native").TouchableOpacity;
  const mockText = jest.requireActual("react-native").Text;
  return {
    InfoCard: (props: {
      title: string;
      subtitle: string;
      onPress?: () => void;
    }) =>
      mockReact.createElement(
        mockTouchableOpacity,
        { testID: `info-card-${props.title}`, onPress: props.onPress },
        mockReact.createElement(mockText, null, props.title),
        mockReact.createElement(mockText, null, props.subtitle),
      ),
  };
});

jest.mock("@legendapp/list/react-native", () => {
  const mockReact = jest.requireActual("react");
  const mockFlatList = jest.requireActual("react-native").FlatList;
  return {
    LegendList: (props: React.ComponentProps<typeof mockFlatList>) =>
      mockReact.createElement(mockFlatList, {
        testID: "legend-list",
        ...props,
      }),
  };
});

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

const mockedRouterPush = jest.mocked(router.push);

const mockResults: SearchResult[] = [
  {
    id: "team1",
    type: "team",
    name: "Test Team 1",
    subtitle: "Soccer Team",
    logo: { uri: "https://example.com/logo1.png" },
    league: "Premier League",
    sport: "Soccer",
    location: "New York",
  },
  {
    id: "team2",
    type: "team",
    name: "Test Team 2",
    subtitle: "Basketball Team",
    logo: { uri: "https://example.com/logo2.png" },
    league: "NBA",
    sport: "Basketball",
    location: "Los Angeles",
  },
  {
    id: "league1",
    type: "league",
    name: "Test League",
    subtitle: "Professional League",
    logo: { uri: "https://example.com/logo.svg" },
    league: "Test",
    sport: "Soccer",
    location: "Europe",
  },
  {
    id: "tournament1",
    type: "tournament",
    name: "Test Tournament",
    subtitle: "Annual Tournament",
    logo: { uri: "https://example.com/logo3.png" },
    league: "",
    sport: "Multi-sport",
    location: "Global",
  },
];

const defaultModes = [
  { key: "teams" as const, label: "Teams", type: "team" as const },
  { key: "leagues" as const, label: "Leagues", type: "league" as const },
  {
    key: "tournaments" as const,
    label: "Tournaments",
    type: "tournament" as const,
  },
];

function buildSearch(overrides: Partial<SearchValue> = {}): SearchValue {
  return {
    query: "",
    results: mockResults,
    markRendered: jest.fn(),
    notifyModeChange: jest.fn(),
    activeMode: "teams",
    setActiveMode: jest.fn(),
    searchActive: false,
    setQuery: jest.fn(),
    setSearchActive: jest.fn(),
    isLoading: false,
    teamError: null,
    leagueError: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("SearchResultsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRouterPush.mockReset();
    mockedRouterPush.mockImplementation(() => {});
  });

  it("renders teams mode and updates when selectedMode changes to leagues", () => {
    const search = buildSearch();
    const { getByText, queryByText, rerender } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    expect(getByText("Test Team 1")).toBeTruthy();
    expect(getByText("Test Team 2")).toBeTruthy();
    expect(queryByText("Test League")).toBeNull();

    rerender(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[1]!}
      />,
    );

    expect(getByText("Test League")).toBeTruthy();
    expect(queryByText("Test Team 1")).toBeNull();
  });

  it("filters results by query and optional resultFilter", () => {
    const search = buildSearch({
      query: "team 1",
      activeMode: "teams",
    });

    const { getByText, queryByText } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
        resultFilter={(result) => result.id !== "team2"}
      />,
    );

    expect(getByText("Test Team 1")).toBeTruthy();
    expect(queryByText("Test Team 2")).toBeNull();
  });

  it("handles result press success and failure logging", () => {
    const search = buildSearch();
    const { getByText } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    fireEvent.press(getByText("Test Team 1"));
    expect(mockedRouterPush).toHaveBeenLastCalledWith("/teams/team1");

    mockedRouterPush.mockImplementation(() => {
      throw new Error("fail");
    });

    fireEvent.press(getByText("Test Team 1"));
    const logMock = createScopedLog as jest.MockedFunction<
      typeof createScopedLog
    >;
    const log = logMock.mock.results[logMock.mock.results.length - 1].value;
    expect(log.error).toHaveBeenCalledWith("failed to navigate to result", {
      err: expect.any(Error),
    });
  });

  it("shows loading indicator", () => {
    const search = buildSearch({
      isLoading: true,
      activeMode: "teams",
    });

    const { UNSAFE_getByType } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("handles errors by mode and when search is active", () => {
    const search = buildSearch({
      activeMode: "teams",
      teamError: "Failed to fetch teams",
      leagueError: "Failed to fetch leagues",
    });

    const { getByText, queryByText, rerender } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    expect(getByText(/Failed to load teams/)).toBeTruthy();
    expect(queryByText(/Failed to load leagues/)).toBeNull();

    rerender(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[1]!}
      />,
    );

    expect(getByText(/Failed to load leagues/)).toBeTruthy();

    const searchActive = buildSearch({
      searchActive: true,
      query: "test",
      teamError: "Failed to fetch teams",
      leagueError: "Failed to fetch leagues",
      activeMode: "teams",
    });

    rerender(
      <SearchResultsScreen
        scope="Test"
        search={searchActive}
        selectedMode={defaultModes[0]!}
      />,
    );

    expect(getByText(/Failed to load teams/)).toBeTruthy();
    expect(getByText(/Failed to load leagues/)).toBeTruthy();
  });

  it("clears results when searchActive is true with empty query", () => {
    const search = buildSearch({
      searchActive: true,
      query: "",
      activeMode: "teams",
    });

    const { queryByText } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    expect(queryByText("Test Team 1")).toBeNull();
  });

  it("logs fallback when notifyModeChange throws", () => {
    const notifyModeChange = jest.fn(() => {
      throw new Error("boom");
    });
    const setActiveMode = jest.fn();
    const search = buildSearch({
      notifyModeChange,
      setActiveMode,
      activeMode: "teams",
    });

    render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    const logMock = createScopedLog as jest.MockedFunction<
      typeof createScopedLog
    >;
    const log = logMock.mock.results[logMock.mock.results.length - 1].value;

    expect(setActiveMode).toHaveBeenCalledWith("teams");
    expect(log.info).toHaveBeenCalledWith("mode changed (fallback)", {
      mode: "teams",
      resultCount: 2,
    });
  });

  it("marks render completion only once on content size change", () => {
    const markRendered = jest.fn();
    const search = buildSearch({
      markRendered,
      activeMode: "teams",
    });

    const { getByTestId } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[0]!}
      />,
    );

    const list = getByTestId("legend-list");
    list.props.onContentSizeChange();
    list.props.onContentSizeChange();

    expect(markRendered).toHaveBeenCalledTimes(1);
    expect(markRendered).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({
        mode: "teams",
        resultCount: 2,
        query: "",
      }),
    );
  });

  it("renders SVG league row when selectedMode is leagues", () => {
    const search = buildSearch();
    const { getByText } = render(
      <SearchResultsScreen
        scope="Test"
        search={search}
        selectedMode={defaultModes[1]!}
      />,
    );

    expect(getByText("Test League")).toBeTruthy();
  });
});
