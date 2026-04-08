import React from "react";
import { render } from "@testing-library/react-native";
import { LeagueBrowserTeams } from "@/components/leagues/league-browser-teams";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockGetSportLogo = jest.fn((_sport?: string) => ({ uri: "sport-logo" }));
jest.mock("@/utils/search", () => ({
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
    mockInfoCard.mockClear();
    mockGetSportLogo.mockClear();
  });

  it("shows error state when leagueTeamsError exists", () => {
    const { getByText } = render(
      <LeagueBrowserTeams
        leagueTeams={[]}
        teamsFetching={false}
        leagueTeamsError={new Error("fail")}
        teamDetailsMap={{}}
        detailsFetching={false}
        detailsError={null}
      />,
    );

    expect(getByText("Teams")).toBeTruthy();
    expect(getByText("Failed to load league teams.")).toBeTruthy();
    expect(mockInfoCard).not.toHaveBeenCalled();
  });

  it("shows empty state when no teams and not busy", () => {
    const { getByText } = render(
      <LeagueBrowserTeams
        leagueTeams={[]}
        teamsFetching={false}
        leagueTeamsError={null}
        teamDetailsMap={{}}
        detailsFetching={false}
        detailsError={null}
      />,
    );

    expect(getByText("No teams in this league")).toBeTruthy();
    expect(mockInfoCard).not.toHaveBeenCalled();
  });

  it("renders InfoCards with logoUrl when present and location subtitle only", () => {
    render(
      <LeagueBrowserTeams
        leagueTeams={[
          { id: "lt1", leagueId: "l1", teamId: "t1", joinedAt: "x" },
        ]}
        teamsFetching={false}
        leagueTeamsError={null}
        teamDetailsMap={{
          t1: {
            id: "t1",
            name: "Alpha FC",
            sport: "soccer",
            location: "Montreal",
            logoUrl: "https://img/logo.png",
          },
        }}
        detailsFetching={false}
        detailsError={null}
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
    render(
      <LeagueBrowserTeams
        leagueTeams={[
          { id: "lt2", leagueId: "l1", teamId: "t2", joinedAt: "x" },
        ]}
        teamsFetching={false}
        leagueTeamsError={null}
        teamDetailsMap={{
          t2: {
            id: "t2",
            name: "Beta",
            sport: "hockey",
            location: "",
            logoUrl: null,
          },
        }}
        detailsFetching={false}
        detailsError={null}
      />,
    );

    expect(mockInfoCard).toHaveBeenCalledTimes(1);
    const props = mockInfoCard.mock.calls[0][0];

    expect(props.subtitle).toBe("Unknown location");
    expect(mockGetSportLogo).toHaveBeenCalledWith("hockey");
    expect(props.image).toEqual({ uri: "sport-logo" });
  });

  it("deduplicates teamIds and still renders per leagueTeams row", () => {
    render(
      <LeagueBrowserTeams
        leagueTeams={[
          { id: "lt1", leagueId: "l1", teamId: "t1", joinedAt: "x" },
          { id: "lt2", leagueId: "l1", teamId: "t1", joinedAt: "y" },
        ]}
        teamsFetching={false}
        leagueTeamsError={null}
        teamDetailsMap={{
          t1: {
            id: "t1",
            name: "Alpha FC",
            sport: "soccer",
            location: "Montreal",
            logoUrl: null,
          },
        }}
        detailsFetching={false}
        detailsError={null}
      />,
    );

    expect(mockInfoCard).toHaveBeenCalledTimes(2);
  });
});
