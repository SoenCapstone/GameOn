jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

import { renderHook } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { getSportLogo } from "@/utils/search";
import { useLeagueResults } from "@/hooks/search/use-league-results";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  ...jest.requireActual("@/hooks/use-axios-clerk"),
  useAxiosWithClerk: jest.fn(() => ({})),
}));

jest.mock("@/constants/images", () => ({
  images: {
    soccerLogo: { testID: "soccer-logo" },
    basketballLogo: { testID: "basketball-logo" },
    volleyballLogo: { testID: "volleyball-logo" },
    defaultLogo: { testID: "default-logo" },
  },
}));

const mockedUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe("useLeagueResults", () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    (useAxiosWithClerk as jest.Mock).mockReset();
    (useAxiosWithClerk as jest.Mock).mockReturnValue({});
  });

  it("registers react-query with leagues key, query, and member flag", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useLeagueResults("find-league", true));

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["leagues", "find-league", true],
        retry: false,
      }),
    );
  });

  it("uses false in queryKey when member is omitted", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useLeagueResults("q"));

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["leagues", "q", false],
      }),
    );
  });

  it("maps league items with region, sport, and League fallbacks", () => {
    const data = {
      items: [
        {
          id: 99,
          name: "Regional League",
          sport: "soccer",
          slug: "regional",
          region: "Europe",
          level: null,
          logoUrl: null,
          privacy: "PUBLIC",
          seasonCount: 1,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "l2",
          name: "Sport League",
          sport: "tennis",
          slug: "sport-league",
          region: null,
          level: null,
          logoUrl: "https://league.png",
          privacy: null,
          seasonCount: 0,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "l3",
          name: "Fallback League",
          sport: "",
          slug: "fallback",
          region: null,
          level: null,
          logoUrl: undefined,
          privacy: null,
          seasonCount: 0,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
      totalElements: 3,
      page: 0,
      size: 3,
      hasNext: false,
    };

    mockedUseQuery.mockReturnValue({
      data,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLeagueResults("any"));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].id).toBe("99");
    expect(result.current.data[0].subtitle).toBe("Europe");
    expect(result.current.data[0].location).toBe("Europe");
    expect(result.current.data[0].logo).toBe(getSportLogo("soccer"));

    expect(result.current.data[1].subtitle).toBe("tennis");
    expect(result.current.data[1].logo).toEqual({ uri: "https://league.png" });

    expect(result.current.data[2].subtitle).toBe("League");
    expect(result.current.data[2].location).toBe("");
    expect(result.current.raw).toBe(data);
  });

  it("forwards loading, error, and refetch from useQuery", async () => {
    const innerRefetch = jest.fn().mockResolvedValue(undefined);
    const err = new Error("league fail");

    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: true,
      error: err,
      refetch: innerRefetch,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useLeagueResults("x"));

    expect(result.current.isFetching).toBe(true);
    expect(result.current.error).toBe(err);

    await result.current.refetch();
    expect(innerRefetch).toHaveBeenCalled();
  });
});
