import { renderHook } from "@testing-library/react-native";
import { useQueries } from "@tanstack/react-query";
import { useExploreVenues } from "@/hooks/use-explore-venues";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

jest.mock("@tanstack/react-query", () => ({
  useQueries: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_LEAGUE_SERVICE_ROUTES: {
    VENUE: (venueId: string) => `/api/v1/league-venues/${venueId}`,
  },
  GO_TEAM_SERVICE_ROUTES: {
    VENUE: (venueId: string) => `/api/v1/team-venues/${venueId}`,
  },
}));

describe("useExploreVenues", () => {
  const mockApi = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAxiosWithClerk as jest.Mock).mockReturnValue(mockApi);
    (useQueries as jest.Mock).mockReturnValue([]);
  });

  it("creates one venue query per unique non-empty venue id", () => {
    renderHook(() =>
      useExploreVenues([
        {
          kind: "league",
          match: { id: "l1", venueId: "venue-1" },
        },
        {
          kind: "league",
          match: { id: "l2", venueId: "venue-1" },
        },
        {
          kind: "team",
          match: { id: "t1", venueId: "venue-2" },
        },
        {
          kind: "team",
          match: { id: "t2" },
        },
      ] as never),
    );

    expect(useQueries).toHaveBeenCalledWith({
      queries: [
        expect.objectContaining({
          queryKey: ["league-venue", "venue-1"],
          retry: false,
        }),
        expect.objectContaining({
          queryKey: ["team-venue", "venue-2"],
          retry: false,
        }),
      ],
    });
  });

  it("calls the correct venue endpoint for each query", async () => {
    let queries:
      | {
          queryFn: () => Promise<unknown>;
          queryKey: string[];
        }[]
      | undefined;
    (useQueries as jest.Mock).mockImplementation(({ queries: nextQueries }) => {
      queries = nextQueries;
      return [];
    });

    mockApi.get
      .mockResolvedValueOnce({ data: { id: "venue-1" } })
      .mockResolvedValueOnce({ data: { id: "venue-2" } });

    renderHook(() =>
      useExploreVenues([
        {
          kind: "league",
          match: { id: "l1", venueId: "venue-1" },
        },
        {
          kind: "team",
          match: { id: "t1", venueId: "venue-2" },
        },
      ] as never),
    );

    await expect(queries?.[0].queryFn()).resolves.toEqual({ id: "venue-1" });
    await expect(queries?.[1].queryFn()).resolves.toEqual({ id: "venue-2" });

    expect(mockApi.get).toHaveBeenNthCalledWith(
      1,
      GO_LEAGUE_SERVICE_ROUTES.VENUE("venue-1"),
    );
    expect(mockApi.get).toHaveBeenNthCalledWith(
      2,
      GO_TEAM_SERVICE_ROUTES.VENUE("venue-2"),
    );
  });

  it("returns a map keyed by venue id from successful query results", () => {
    (useQueries as jest.Mock).mockReturnValue([
      { data: { id: "venue-1", name: "Field One" } },
      { data: { id: "venue-2", name: "Field Two" } },
      { data: undefined },
    ]);

    const { result } = renderHook(() => useExploreVenues([]));

    expect(result.current).toBeInstanceOf(Map);
    expect(Array.from(result.current.entries())).toEqual([
      ["venue-1", { id: "venue-1", name: "Field One" }],
      ["venue-2", { id: "venue-2", name: "Field Two" }],
    ]);
  });
});
