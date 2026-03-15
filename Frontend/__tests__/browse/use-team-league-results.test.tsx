import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { useTeamLeagueResults } from "@/components/browse/hooks/use-team-league-results";
import * as utils from "@/components/browse/utils";

jest.mock("@/components/browse/utils", () => ({
  useTeamResults: jest.fn(),
  useLeagueResults: jest.fn(),
}));

type TeamResult = {
  id: string;
  type: "team";
  name: string;
  subtitle: string;
  logo: string;
  league: string;
};
type LeagueResult = {
  id: string;
  type: "league";
  name: string;
  subtitle: string;
  logo: string;
  league: string;
};
type TeamResultsHook = () => {
  data: TeamResult[];
  isLoading: boolean;
  error: unknown;
};
type LeagueResultsHook = () => {
  data: LeagueResult[];
  isLoading: boolean;
  error: unknown;
};
const useTeamResults =
  utils.useTeamResults as unknown as jest.MockedFunction<TeamResultsHook>;
const useLeagueResults =
  utils.useLeagueResults as unknown as jest.MockedFunction<LeagueResultsHook>;

function TestComp({ query }: Readonly<{ query: string }>) {
  const { data } = useTeamLeagueResults(query);
  return <Text testID="out">{JSON.stringify(data.map((d) => d.id))}</Text>;
}

describe("useTeamLeagueResults", () => {
  it("returns teams and leagues in alphabetical order", () => {
    useTeamResults.mockReturnValue({
      data: [
        {
          id: "t1",
          type: "team",
          name: "Team One",
          subtitle: "soccer",
          logo: "L1",
          league: "",
        },
        {
          id: "t2",
          type: "team",
          name: "Team Two",
          subtitle: "soccer",
          logo: "L2",
          league: "",
        },
      ],
      isLoading: false,
      error: null,
    });

    useLeagueResults.mockReturnValue({
      data: [
        {
          id: "l1",
          type: "league",
          name: "League A",
          subtitle: "league",
          logo: "🏅",
          league: "A",
        },
      ],
      isLoading: false,
      error: null,
    });

    const { getByTestId } = render(<TestComp query="x" />);
    const text = getByTestId("out").props.children as string;
    const ids = JSON.parse(text) as string[];
    expect(ids).toEqual(["l1", "t1", "t2"]);
  });

  it("handles empty team data", () => {
    useTeamResults.mockReturnValue({ data: [], isLoading: false, error: null });
    useLeagueResults.mockReturnValue({
      data: [
        {
          id: "l1",
          type: "league",
          name: "League A",
          subtitle: "league",
          logo: "🏅",
          league: "A",
        },
      ],
      isLoading: false,
      error: null,
    });

    const { getByTestId } = render(<TestComp query="x" />);
    const ids = JSON.parse(
      getByTestId("out").props.children as string,
    ) as string[];
    expect(ids).toEqual(["l1"]);
  });
});
