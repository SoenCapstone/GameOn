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

describe("useTeamOverview", () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
    jest.requireMock("@/utils/logger").__mockInfo.mockReset();
    jest.useRealTimers();
  });

  it("configures and resolves the overview query for a team id", async () => {
    jest.useFakeTimers();

    const queryResult = {
      data: undefined,
      isLoading: true,
      error: null,
    };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useTeamOverview("team-123");
    expect(result).toBe(queryResult);
    expect(useQuery).toHaveBeenCalledTimes(1);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: string[];
      queryFn: () => Promise<TeamOverviewResponse>;
      enabled: boolean;
      retry: boolean;
    };

    expect(options.queryKey).toEqual(["team-overview", "team-123"]);
    expect(options.enabled).toBe(true);
    expect(options.retry).toBe(false);

    const queryPromise = options.queryFn();
    await jest.advanceTimersByTimeAsync(120);
    const data = await queryPromise;

    expect(data).toEqual({
      seasonLabel: "Season 2026",
      tiles: [
        { key: "points", label: "Points" },
        { key: "matches", label: "Matches" },
        { key: "streak", label: "Streak" },
        { key: "minutes", label: "Minutes" },
      ],
      rosterCounts: {},
      performance: {},
    });
    expect(jest.requireMock("@/utils/logger").__mockInfo).toHaveBeenCalledWith(
      "Fetching team overview",
      { teamId: "team-123" },
    );
  });

  it("disables the query when team id is empty", () => {
    const queryResult = {
      data: undefined,
      isLoading: false,
      error: null,
    };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useTeamOverview("");
    expect(result).toBe(queryResult);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: string[];
      enabled: boolean;
      retry: boolean;
    };

    expect(options.queryKey).toEqual(["team-overview", ""]);
    expect(options.enabled).toBe(false);
    expect(options.retry).toBe(false);
  });
});
