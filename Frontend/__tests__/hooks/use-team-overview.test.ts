import { useQuery } from "@tanstack/react-query";
import {
  useTeamOverview,
  type TeamOverviewResponse,
} from "@/hooks/use-team-overview";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/utils/logger", () => {
  const mockInfo = jest.fn();

  return {
    createScopedLog: jest.fn(() => ({
      info: mockInfo,
    })),
    __mockInfo: mockInfo,
  };
});

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(() => ({ get: jest.fn() })),
  GO_TEAM_SERVICE_ROUTES: {
    MATCHES: (id: string) => `/teams/${id}/matches`,
  },
}));

jest.mock("@/hooks/use-team-detail", () => ({
  teamDetailQueryOptions: jest.fn(() => ({ queryKey: ["team-detail", "mock"] })),
}));

describe("useTeamOverview", () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
    jest.requireMock("@/utils/logger").__mockInfo.mockReset();
    jest.useRealTimers();
  });

  it("configures 4 queries and the overview query has the correct key and options", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    const result = useTeamOverview("team-123");

    // Hook calls useQuery 4 times: teamDetail, members, matches, overview
    expect(useQuery).toHaveBeenCalledTimes(4);

    const overviewOptions = (useQuery as jest.Mock).mock.calls[3][0] as {
      queryKey: string[];
      enabled: boolean;
      retry: boolean;
    };

    expect(overviewOptions.queryKey).toEqual(["team-overview", "team-123"]);
    expect(overviewOptions.retry).toBe(false);
    // enabled is false because dependencies (teamDetail, members, matches) are all undefined
    expect(overviewOptions.enabled).toBe(false);
    expect(result).toEqual({ data: undefined, isLoading: false, error: null });
  });

  it("enables the overview query when all dependencies are resolved", () => {
    (useQuery as jest.Mock)
      .mockReturnValueOnce({ data: { totalMatches: 3, totalPoints: 9 } }) // teamDetail
      .mockReturnValueOnce({ data: [{ role: "OWNER" }] }) // members
      .mockReturnValueOnce({ data: [] }) // matches
      .mockReturnValue({ data: undefined, isLoading: false, error: null }); // overview

    useTeamOverview("team-123");

    const overviewOptions = (useQuery as jest.Mock).mock.calls[3][0] as {
      enabled: boolean;
    };

    expect(overviewOptions.enabled).toBe(true);
  });

  it("resolves queryFn with correct shape", async () => {
    jest.useFakeTimers();

    (useQuery as jest.Mock)
      .mockReturnValueOnce({
        data: {
          totalMatches: 1,
          totalPoints: 3,
          winStreak: 1,
          minutesPlayed: 90,
          totalShotsOnTarget: 5,
          totalFouls: 2,
        },
      }) // teamDetail
      .mockReturnValueOnce({
        data: [{ role: "OWNER" }, { role: "PLAYER" }, { role: "PLAYER" }],
      }) // members
      .mockReturnValueOnce({
        data: [
          {
            status: "COMPLETED",
            homeTeamId: "team-123",
            awayTeamId: "other",
            homeScore: 2,
            awayScore: 1,
          },
        ],
      }) // matches
      .mockReturnValue({ data: undefined, isLoading: false, error: null }); // overview

    useTeamOverview("team-123");

    const overviewOptions = (useQuery as jest.Mock).mock.calls[3][0] as {
      queryFn: () => Promise<TeamOverviewResponse>;
    };

    const queryPromise = overviewOptions.queryFn();
    await jest.advanceTimersByTimeAsync(120);
    const data = await queryPromise;

    expect(data.seasonLabel).toBe(`Season ${new Date().getFullYear()}`);
    expect(data.tiles).toHaveLength(4);
    expect(data.tiles[0].label).toBe("🏆 Points");
    expect(data.tiles[1].label).toBe("📅 Matches");
    expect(data.tiles[2].label).toBe("🔥 Streak");
    expect(data.tiles[3].label).toBe("⏱ Minutes");
    expect(data.record).toBe("1W - 0L");
    expect(data.rosterCounts.total).toBe(3);
    expect(data.rosterCounts.owner).toBe(1);
    expect(data.rosterCounts.players).toBe(2);

    expect(jest.requireMock("@/utils/logger").__mockInfo).toHaveBeenCalledWith(
      "Fetching team overview",
      { teamId: "team-123" },
    );
  });

  it("disables the query when team id is empty", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    useTeamOverview("");

    const overviewOptions = (useQuery as jest.Mock).mock.calls[3][0] as {
      queryKey: string[];
      enabled: boolean;
      retry: boolean;
    };

    expect(overviewOptions.queryKey).toEqual(["team-overview", ""]);
    expect(overviewOptions.enabled).toBe(false);
    expect(overviewOptions.retry).toBe(false);
  });
});
