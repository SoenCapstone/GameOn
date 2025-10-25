import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { useTeamLeagueResults } from "@/components/browse/hooks/useTeamLeagueResults";
import * as utils from "@/components/browse/utils";

jest.mock("@/components/browse/utils", () => ({
  useTeamResults: jest.fn(),
  filterLocalLeagues: jest.fn(),
}));

const useTeamResults = utils.useTeamResults as jest.MockedFunction<any>;
const filterLocalLeagues = utils.filterLocalLeagues as jest.MockedFunction<any>;

function TestComp({ query }: { query: Readonly<string> }) {
  const { data } = useTeamLeagueResults(query);
  return <Text testID="out">{JSON.stringify(data.map((d) => d.id))}</Text>;
}

describe("useTeamLeagueResults", () => {
  it("returns teams reversed then leagues", () => {
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

    filterLocalLeagues.mockReturnValue([
      {
        id: "l1",
        type: "league",
        name: "League A",
        subtitle: "league",
        logo: "🏅",
        league: "A",
      },
    ]);

    const { getByTestId } = render(<TestComp query="x" />);
    const text = getByTestId("out").props.children as string;
    const ids = JSON.parse(text) as string[];
    expect(ids).toEqual(["t2", "t1", "l1"]);
  });

  it("handles empty team data", () => {
    useTeamResults.mockReturnValue({ data: [], isLoading: false, error: null });
    filterLocalLeagues.mockReturnValue([
      {
        id: "l1",
        type: "league",
        name: "League A",
        subtitle: "league",
        logo: "🏅",
        league: "A",
      },
    ]);

    const { getByTestId } = render(<TestComp query="x" />);
    const ids = JSON.parse(
      getByTestId("out").props.children as string,
    ) as string[];
    expect(ids).toEqual(["l1"]);
  });
});
