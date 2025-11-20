import {
  mapSportToEmoji,
  filterLocalLeagues,
  fetchTeamResults,
  useTeamResults,
} from "@/components/browse/utils";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => {
  const original = jest.requireActual("@/hooks/use-axios-clerk");
  return {
    ...original,
    useAxiosWithClerk: jest.fn(() => ({})),
  };
});



describe("mapSportToEmoji", () => {
  it("returns correct emoji for known sports", () => {
    expect(mapSportToEmoji("soccer")).toBe("⚽");
    expect(mapSportToEmoji("basketball")).toBe("🏀");
    expect(mapSportToEmoji("baseball")).toBe("⚾");
    expect(mapSportToEmoji("american football")).toBe("🏈");
    expect(mapSportToEmoji("hockey")).toBe("🏒");
    expect(mapSportToEmoji("tennis")).toBe("🎾");
    expect(mapSportToEmoji("rugby")).toBe("🏉");
    expect(mapSportToEmoji("volleyball")).toBe("🏐");
    expect(mapSportToEmoji("cricket")).toBe("🏏");
    expect(mapSportToEmoji("golf")).toBe("⛳️");
  });
  it("returns default emoji for unknown sport", () => {
    expect(mapSportToEmoji("quidditch")).toBe("🏅");
    expect(mapSportToEmoji("")).toBe("🏅");
    expect(mapSportToEmoji()).toBe("🏅");
  });
 });

describe("filterLocalLeagues", () => {
  it("returns all leagues if query is empty", () => {
    const leagues = filterLocalLeagues("");
    expect(leagues.length).toBeGreaterThan(0);
    expect(leagues.every((r) => r.type === "league")).toBe(true);
  });
  it("filters leagues by name", () => {
    const leagues = filterLocalLeagues("bundes");
    expect(leagues.length).toBe(1);
    expect(leagues.every((l) => l.name.toLowerCase().includes("bundes"))).toBe(
      true,
    );
  });
  it("is case-insensitive", () => {
    const leagues = filterLocalLeagues("PREMIER");
    expect(leagues.length).toBe(1);
    expect(leagues.every((l) => l.name.toLowerCase().includes("premier"))).toBe(
      true,
    );
  });
});

describe("fetchTeamResults", () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({
      data: {
        items: [
          {
            id: "abc",
            name: "Test Team",
            sport: "soccer",
            leagueId: null,
            slug: "test-team",
            privacy: "PUBLIC",
            maxRoster: 11,
            archived: false,
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ],
        totalElements: 1,
        page: 0,
        size: 20,
        hasNext: false,
      },
    });
  });
  it("maps backend teams to SearchResult[] with emoji fallback", async () => {
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;
    const results = await fetchTeamResults(fakeApi, "Test");
    expect(results.items).toHaveLength(1);
    expect(results.items[0]).toMatchObject({
      id: "abc",
      name: "Test Team",
      sport: "soccer",
    });
  });
  it("throws error if fetch fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("network error"));
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;
    await expect(fetchTeamResults(fakeApi, "fail")).rejects.toThrow(
      "network error",
    );
  });

  it("sends query param when query is provided", async () => {
    mockedAxios.get.mockClear();
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;
    await fetchTeamResults(fakeApi, "SearchTerm");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[0]).toBeDefined(); // url
    expect(callArgs[1]).toBeDefined(); // config
    expect(callArgs[1]!.params).toMatchObject({ size: "200", q: "SearchTerm" });
  });

  it("does not send q param when query is empty", async () => {
    mockedAxios.get.mockClear();
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;
    await fetchTeamResults(fakeApi, "");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[1]!.params).toMatchObject({ size: "200" });
    expect(callArgs[1]!.params.q).toBeUndefined();
  });
});

describe("useTeamResults mapping", () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
    (useAxiosWithClerk as jest.Mock).mockReset();
    (useAxiosWithClerk as jest.Mock).mockReturnValue({});
  });

  it("uses provided logoUrl and stringifies numeric ids", () => {
    const data = {
      items: [
        {
          id: 123,
          name: "Numeric Team",
          sport: "basketball",
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

    (useQuery as jest.Mock).mockReturnValue({
      data,
      isLoading: false,
      isFetching: false,
      error: null,
    });

    const res = useTeamResults("any");
    expect(res.data).toHaveLength(1);
    expect(res.data[0].id).toBe("123");
    expect(res.data[0].logo).toBe("https://logo.png");
    expect(res.data[0].subtitle).toBe("basketball");
  });

  it("falls back to emoji and 'Team' subtitle when sport or logo missing", () => {
    const data = {
      items: [
        {
          id: "abc",
          name: "No Sport Team",
          sport: "",
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

    (useQuery as jest.Mock).mockReturnValue({
      data,
      isLoading: false,
      isFetching: false,
      error: null,
    });

    const res = useTeamResults("any");
    expect(res.data).toHaveLength(2);

    expect(res.data[0].subtitle).toBe("Team");
    expect(res.data[0].logo).toBe(mapSportToEmoji("") );

    expect(res.data[1].subtitle).toBe("tennis");
    expect(res.data[1].logo).toBe(mapSportToEmoji("tennis"));
  });
});
