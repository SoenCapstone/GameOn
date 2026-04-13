import { fireEvent, render, screen } from "@testing-library/react-native";
import { MatchListSections } from "@/components/matches/match-list-sections";

jest.mock("@/components/matches/match-card", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return {
    MatchCard: jest.fn((props) =>
      React.createElement(
        Pressable,
        { onPress: props.onPress, testID: `match-card-${props.homeName}` },
        React.createElement(Text, null, `${props.homeName} vs ${props.awayName}`),
      ),
    ),
  };
});

jest.mock("@/components/ui/loading", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Loading: jest.fn(() => React.createElement(Text, null, "Loading")),
  };
});

jest.mock("@/components/ui/empty", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Empty: jest.fn(({ message }) => React.createElement(Text, null, message)),
  };
});

describe("MatchListSections", () => {
  const match = {
    id: "match-1",
    homeName: "Falcons",
    awayName: "Wolves",
    contextLabel: "League Match",
    status: "CONFIRMED",
    startTime: "2026-04-03T10:00:00.000Z",
    isPast: false,
  };

  it("renders only loading when loading is true", () => {
    render(
      <MatchListSections
        today={[]}
        upcoming={[]}
        past={[]}
        isLoading
        onMatchPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Loading")).toBeTruthy();
    expect(screen.queryByText("No matches available")).toBeNull();
  });

  it("renders only the empty state when there are no matches", () => {
    render(
      <MatchListSections
        today={[]}
        upcoming={[]}
        past={[]}
        isLoading={false}
        onMatchPress={jest.fn()}
      />,
    );

    expect(screen.getByText("No matches available")).toBeTruthy();
    expect(screen.queryByText("Loading")).toBeNull();
  });

  it("renders populated sections and forwards match presses", () => {
    const onMatchPress = jest.fn();

    render(
      <MatchListSections
        today={[match]}
        upcoming={[{ ...match, id: "match-2", homeName: "Owls" }]}
        past={[{ ...match, id: "match-3", homeName: "Bears", isPast: true }]}
        isLoading={false}
        onMatchPress={onMatchPress}
      />,
    );

    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("Upcoming")).toBeTruthy();
    expect(screen.getByText("Past")).toBeTruthy();

    fireEvent.press(screen.getByTestId("match-card-Falcons"));
    expect(onMatchPress).toHaveBeenCalledWith(match);
  });
});
