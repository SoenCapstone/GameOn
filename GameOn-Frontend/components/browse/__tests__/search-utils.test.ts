import {
  mapSportToEmoji,
  filterLocalLeagues,
  fetchTeamResults,
} from "@/components/browse/utils";

import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
