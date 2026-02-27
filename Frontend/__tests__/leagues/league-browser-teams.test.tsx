import React from "react";
import { render } from "@testing-library/react-native";
import { LeagueBrowserTeams } from "@/components/leagues/league-browser-teams";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: () => ({}),
}));

const mockUseQueries = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQueries: (args: unknown[]) => mockUseQueries(args),
}));

jest.mock("@/hooks/use-team-detail", () => ({
  teamDetailQueryOptions: (_api: unknown, teamId: string) => ({
    queryKey: ["team", teamId],
    queryFn: jest.fn(),
  }),
}));

const mockGetSportLogo = jest.fn((_sport?: string) => ({ uri: "sport-logo" }));
jest.mock("@/components/browse/utils", () => ({
  getSportLogo: (sport: string) => mockGetSportLogo(sport),
}));

const mockInfoCard = jest.fn((_props: Record<string, unknown>) => null);
jest.mock("@/components/info-card", () => ({
  InfoCard: (props: Record<string, unknown>) => {
    mockInfoCard(props);
    return null;
  },
}));

describe("LeagueBrowserTeams", () => {
  beforeEach(() => {
    mockUseQueries.mockReset();
    mockInfoCard.mockClear();
    mockGetSportLogo.mockClear();
  });

  it("shows error state when leagueTeamsError exists", () => {
    mockUseQueries.mockReturnValue([]);
    const { getByText } = render(
      <LeagueBrowserTeams
        leagueId="l1"
        leagueTeams={[]}
        teamsFetching={false}
        leagueTeamsError={new Error("fail")}
      />,
    );

    expect(getByText("Teams")).toBeTruthy();
    expect(getByText("Failed to load league teams.")).toBeTruthy();
    expect(mockInfoCard).not.toHaveBeenCalled();
  });

  it("shows empty state when no teams and not busy", () => {
    mockUseQueries.mockReturnValue([]);
    const { getByText } = render(
      <LeagueBrowserTeams
        leagueId="l1"
        leagueTeams={[]}
        teamsFetching={false}
        leagueTeamsError={null}
      />,
    );

    expect(getByText("No teams in this league yet.")).toBeTruthy();
    expect(mockInfoCard).not.toHaveBeenCalled();
  });

  it("renders InfoCards with logoUrl when present and location subtitle only", () => {
    mockUseQueries.mockReturnValue([
      {
        isFetching: false,
        error: null,
        data: {
          id: "t1",
          name: "Alpha FC",
          sport: "soccer",
          location: "Montreal",
          logoUrl: "https://img/logo.png",
        },
      },
    ]);

    render(
      <LeagueBrowserTeams
        leagueId="l1"
        leagueTeams={[
          { id: "lt1", leagueId: "l1", teamId: "t1", joinedAt: "x" },
        ]}
        teamsFetching={false}
        leagueTeamsError={null}
      />,
    );

    expect(mockInfoCard).toHaveBeenCalledTimes(1);
    const props = mockInfoCard.mock.calls[0][0];

    expect(props.title).toBe("Alpha FC");
    expect(props.subtitle).toBe("Montreal");
    expect(props.image).toEqual({ uri: "https://img/logo.png" });
    expect(mockGetSportLogo).not.toHaveBeenCalled();
  });

  it("uses getSportLogo fallback when logoUrl missing, and uses Unknown location if location blank", () => {
    mockUseQueries.mockReturnValue([
      {
        isFetching: false,
        error: null,
        data: {
          id: "t2",
          name: "Beta",
          sport: "hockey",
          location: "",
          logoUrl: null,
        },
      },
    ]);

    render(
      <LeagueBrowserTeams
        leagueId="l1"
        leagueTeams={[
          { id: "lt2", leagueId: "l1", teamId: "t2", joinedAt: "x" },
        ]}
        teamsFetching={false}
        leagueTeamsError={null}
      />,
    );

    expect(mockInfoCard).toHaveBeenCalledTimes(1);
    const props = mockInfoCard.mock.calls[0][0];

    expect(props.subtitle).toBe("Unknown location");
    expect(mockGetSportLogo).toHaveBeenCalledWith("hockey");
    expect(props.image).toEqual({ uri: "sport-logo" });
  });

  it("deduplicates teamIds and still renders per leagueTeams row", () => {
    mockUseQueries.mockReturnValue([
      {
        isFetching: false,
        error: null,
        data: {
          id: "t1",
          name: "Alpha FC",
          sport: "soccer",
          location: "Montreal",
          logoUrl: null,
        },
      },
    ]);

    render(
      <LeagueBrowserTeams
        leagueId="l1"
        leagueTeams={[
          { id: "lt1", leagueId: "l1", teamId: "t1", joinedAt: "x" },
          { id: "lt2", leagueId: "l1", teamId: "t1", joinedAt: "y" },
        ]}
        teamsFetching={false}
        leagueTeamsError={null}
      />,
    );

    expect(mockUseQueries).toHaveBeenCalledTimes(1);
    expect(mockInfoCard).toHaveBeenCalledTimes(2);
  });
});