import {
  mapSportToEmoji,
  filterLocalLeagues,
  fetchTeamResults,
} from "@/components/SearchPage/utils";

import axios from 'axios';

// Mock SecureStore for fetchTeamResults
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue("test-token"),
}));

// Mock axios used by fetchTeamResults
jest.mock('axios');
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
    expect(leagues[0].name.toLowerCase()).toContain("bundes");
  });
  it("is case-insensitive", () => {
    const leagues = filterLocalLeagues("PREMIER");
    expect(leagues.length).toBe(1);
    expect(leagues[0].name).toMatch(/Premier/i);
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
    const results = await fetchTeamResults("Test");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "abc",
      type: "team",
      name: "Test Team",
      subtitle: "soccer",
      logo: "⚽",
    });
  });
  it("returns empty array if fetch fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));
    const results = await fetchTeamResults("fail");
    expect(results).toEqual([]);
  });
});
