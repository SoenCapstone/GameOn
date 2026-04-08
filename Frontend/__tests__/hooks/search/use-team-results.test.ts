jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

import { renderHook } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { getSportLogo } from "@/utils/search";
import { useTeamResults } from "@/hooks/search/use-team-results";

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

describe("useTeamResults", () => {
  beforeEach(() => {
    mockedUseQuery.mockReset();
    (useAxiosWithClerk as jest.Mock).mockReset();
    (useAxiosWithClerk as jest.Mock).mockReturnValue({});
  });

  it("registers react-query with teams key, query, and member flag", () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useTeamResults("find-me", true));

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["teams", "find-me", true],
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

    renderHook(() => useTeamResults("q"));

    expect(mockedUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["teams", "q", false],
      }),
    );
  });

  it("maps items with logoUrl and stringifies numeric ids", () => {
    const data = {
      items: [
        {
          id: 123,
          name: "Numeric Team",
          sport: "basketball",
          location: "Court",
          leagueId: null,
          slug: "numeric-team",
          logoUrl: "https://logo.png",
          privacy: "PUBLIC",
          maxRoster: 12,
          archived: false,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
      totalElements: 1,
      page: 0,
      size: 1,
      hasNext: false,
    };

    mockedUseQuery.mockReturnValue({
      data,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useTeamResults("any"));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].id).toBe("123");
    expect(result.current.data[0].logo).toEqual({ uri: "https://logo.png" });
    expect(result.current.data[0].subtitle).toBe("basketball");
    expect(result.current.data[0].location).toBe("Court");
    expect(result.current.raw).toBe(data);
  });

  it("falls back to sport logo and Team subtitle when sport or logo missing", () => {
    const data = {
      items: [
        {
          id: "abc",
          name: "No Sport Team",
          sport: "",
          location: "Here",
          leagueId: null,
          slug: "no-sport-team",
          logoUrl: null,
          privacy: "PUBLIC",
          maxRoster: null,
          archived: false,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          id: "def",
          name: "Tennis Team",
          sport: "tennis",
          location: "There",
          leagueId: null,
          slug: "tennis-team",
          logoUrl: undefined,
          privacy: "PUBLIC",
          maxRoster: null,
          archived: false,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
      totalElements: 2,
      page: 0,
      size: 2,
      hasNext: false,
    };

    mockedUseQuery.mockReturnValue({
      data,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useTeamResults("any"));

    expect(result.current.data[0].subtitle).toBe("Team");
    expect(result.current.data[0].logo).toBe(getSportLogo(""));

    expect(result.current.data[1].subtitle).toBe("tennis");
    expect(result.current.data[1].logo).toBe(getSportLogo("tennis"));
  });

  it("forwards loading, error, and refetch from useQuery", async () => {
    const innerRefetch = jest.fn().mockResolvedValue(undefined);
    const err = new Error("team fail");

    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: err,
      refetch: innerRefetch,
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useTeamResults("x"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(err);
    expect(result.current.data).toEqual([]);

    await result.current.refetch();
    expect(innerRefetch).toHaveBeenCalled();
  });
});
