import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ActivityIndicator } from "react-native";
import { SearchResultsScreen } from "@/components/browse/search-results-screen";
import { useSearch } from "@/contexts/search-context";
import { createScopedLog } from "@/utils/logger";
import type { SearchResult } from "@/components/browse/constants";

jest.mock("@/contexts/search-context", () => ({
  useSearch: jest.fn(),
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: jest.fn(() => 60),
}));

jest.mock("@/components/ui/content-area", () => {
  const mockReact = jest.requireActual("react");
  const mockView = jest.requireActual("react-native").View;
  return {
    ContentArea: (props: any) =>
      mockReact.createElement(
        mockView,
        { testID: "content-area" },
        props.children,
      ),
  };
});

jest.mock("@/components/info-card", () => {
  const mockReact = jest.requireActual("react");
  const mockTouchableOpacity =
    jest.requireActual("react-native").TouchableOpacity;
  const mockText = jest.requireActual("react-native").Text;
  return {
    InfoCard: (props: any) =>
      mockReact.createElement(
        mockTouchableOpacity,
        { testID: `info-card-${props.title}`, onPress: props.onPress },
        mockReact.createElement(mockText, null, props.title),
        mockReact.createElement(mockText, null, props.subtitle),
      ),
  };
});

jest.mock("@legendapp/list", () => {
  const mockReact = jest.requireActual("react");
  const mockFlatList = jest.requireActual("react-native").FlatList;
  return {
    LegendList: (props: any) =>
      mockReact.createElement(mockFlatList, {
        testID: "legend-list",
        ...props,
      }),
  };
});

jest.mock("@/components/ui/tabs", () => {
  const mockReact = jest.requireActual("react");
  const mockView = jest.requireActual("react-native").View;
  const mockTouchableOpacity =
    jest.requireActual("react-native").TouchableOpacity;
  const mockText = jest.requireActual("react-native").Text;
  return {
    Tabs: (props: any) => {
      const { values, onValueChange } = props;
      return mockReact.createElement(
        mockView,
        { testID: "tabs" },
        values?.map((value: string) =>
          mockReact.createElement(
            mockTouchableOpacity,
            {
              key: value,
              testID: `tab-${value}`,
              onPress: () => onValueChange?.(value),
            },
            mockReact.createElement(mockText, null, value),
          ),
        ),
      );
    },
  };
});

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

const mockedUseSearch = useSearch as jest.MockedFunction<typeof useSearch>;

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

const defaultSearchContext = {
  query: "",
  results: mockResults,
  markRendered: jest.fn(),
  notifyModeChange: jest.fn(),
  activeMode: "teams",
  setActiveMode: jest.fn(),
  searchActive: false,
  isLoading: false,
  teamError: null,
  leagueError: null,
  refetch: jest.fn().mockResolvedValue(undefined),
  setQuery: jest.fn(),
  setSearchActive: jest.fn(),
} as any;

describe("SearchResultsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseSearch.mockReturnValue(defaultSearchContext);
  });

  it("renders default teams mode and switches to leagues", () => {
    const onResultPress = jest.fn();
    const { getByTestId, getByText, queryByText } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
      />,
    );

    expect(getByTestId("tabs")).toBeTruthy();
    expect(getByText("Test Team 1")).toBeTruthy();
    expect(getByText("Test Team 2")).toBeTruthy();
    expect(queryByText("Test League")).toBeNull();

    fireEvent.press(getByTestId("tab-Leagues"));
    expect(getByText("Test League")).toBeTruthy();
    expect(queryByText("Test Team 1")).toBeNull();
  });

  it("filters results by query and optional resultFilter", () => {
    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      query: "team 1",
    });

    const onResultPress = jest.fn();
    const { getByText, queryByText } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
        resultFilter={(result) => result.id !== "team2"}
      />,
    );

    expect(getByText("Test Team 1")).toBeTruthy();
    expect(queryByText("Test Team 2")).toBeNull();
  });

  it("handles result press success and failure logging", () => {
    const onResultPress = jest.fn();
    const { getByText, rerender } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
      />,
    );

    fireEvent.press(getByText("Test Team 1"));
    expect(onResultPress).toHaveBeenCalledWith(mockResults[0]);

    const throwingPress = jest.fn(() => {
      throw new Error("fail");
    });
    rerender(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={throwingPress}
      />,
    );

    fireEvent.press(getByText("Test Team 1"));
    const logMock = createScopedLog as jest.MockedFunction<
      typeof createScopedLog
    >;
    const log = logMock.mock.results[logMock.mock.results.length - 1].value;
    expect(log.error).toHaveBeenCalledWith("failed to navigate to result", {
      err: expect.any(Error),
    });
  });

  it("shows loading indicator and refresh activity", () => {
    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      isLoading: true,
    });

    const onResultPress = jest.fn();
    const { UNSAFE_getByType } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
      />,
    );

    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it("handles errors by mode and when search is active", () => {
    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      activeMode: "teams",
      teamError: "Failed to fetch teams",
      leagueError: "Failed to fetch leagues",
    });

    const onResultPress = jest.fn();
    const { getByText, queryByText, getByTestId, queryByTestId, rerender } =
      render(
        <SearchResultsScreen
          logScope="Test"
          backgroundPreset="blue"
          modes={defaultModes}
          onResultPress={onResultPress}
        />,
      );

    expect(getByText(/Failed to load teams/)).toBeTruthy();
    expect(queryByText(/Failed to load leagues/)).toBeNull();

    fireEvent.press(getByTestId("tab-Leagues"));
    expect(getByText(/Failed to load leagues/)).toBeTruthy();

    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      searchActive: true,
      query: "test",
      teamError: "Failed to fetch teams",
      leagueError: "Failed to fetch leagues",
    });

    rerender(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
      />,
    );

    expect(getByText(/Failed to load teams/)).toBeTruthy();
    expect(getByText(/Failed to load leagues/)).toBeTruthy();
    expect(queryByTestId("tabs")).toBeNull();
  });

  it("hides tabs and clears results when searchActive is true with empty query", () => {
    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      searchActive: true,
      query: "",
    });

    const onResultPress = jest.fn();
    const { queryByTestId, queryByText } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
      />,
    );

    expect(queryByTestId("tabs")).toBeNull();
    expect(queryByText("Test Team 1")).toBeNull();
  });

  it("logs fallback when notifyModeChange throws", () => {
    const notifyModeChange = jest.fn(() => {
      throw new Error("boom");
    });
    const setActiveMode = jest.fn();
    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      notifyModeChange,
      setActiveMode,
    });

    const onResultPress = jest.fn();
    render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
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
    mockedUseSearch.mockReturnValue({
      ...defaultSearchContext,
      markRendered,
    });

    const onResultPress = jest.fn();
    const { getByTestId } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={defaultModes}
        onResultPress={onResultPress}
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

  it("renders SVG league and returns null when no mode is selected", () => {
    const onResultPress = jest.fn();
    const { getByText, queryByTestId, rerender } = render(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={[{ key: "leagues", label: "Leagues", type: "league" }]}
        onResultPress={onResultPress}
      />,
    );

    expect(getByText("Test League")).toBeTruthy();

    rerender(
      <SearchResultsScreen
        logScope="Test"
        backgroundPreset="blue"
        modes={[]}
        onResultPress={onResultPress}
      />,
    );

    expect(queryByTestId("content-area")).toBeNull();
  });
});
