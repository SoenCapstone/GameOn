import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AxiosInstance } from "axios";
import type { MockedFunction } from "jest-mock";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import type { TeamPostResponse } from "@/types/board";
import type { LeagueSummaryResponse } from "@/types/leagues";
import type { TeamMatch } from "@/types/matches";
import type { TeamSummaryResponse } from "@/types/teams";
import {
  buildMatchItem,
  buildHomeItems,
  buildPostItem,
  collectFeedMatchTeamIds,
  collectFeedPostAuthorIds,
  fetchLeagueSummaryMap,
  fetchFeedBuckets,
  fetchTeamSummaryMap,
  normalizeLeagueSpace,
  normalizeTeamSpace,
} from "@/utils/home";

type MockGet = MockedFunction<
  (
    url: string,
    config?: { params?: Record<string, string | number | boolean> },
  ) => Promise<{ data: unknown }>
>;

const mockGet = jest.fn() as MockGet;
const mockApi = { get: mockGet } as unknown as AxiosInstance;

const log = {
  warn: jest.fn(),
};

describe("@/utils/home", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeTeamSpace", () => {
    it("maps team summary to a team feed space", () => {
      const team: TeamSummaryResponse = {
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        logoUrl: "https://example.com/logo.png",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      expect(normalizeTeamSpace(team)).toEqual({
        kind: "team",
        id: "team-1",
        name: "Raptors",
        logoUrl: "https://example.com/logo.png",
        sport: "basketball",
      });
    });

    it("normalizes nullish logo and sport to null", () => {
      const team: TeamSummaryResponse = {
        id: "team-2",
        name: "Wolves",
        logoUrl: undefined,
        sport: undefined,
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      expect(normalizeTeamSpace(team)).toEqual(
        expect.objectContaining({
          kind: "team",
          id: "team-2",
          name: "Wolves",
          logoUrl: null,
          sport: null,
        }),
      );
    });
  });

  describe("normalizeLeagueSpace", () => {
    it("maps league summary to a league feed space", () => {
      const league: LeagueSummaryResponse = {
        id: "league-1",
        name: "Spring",
        sport: "basketball",
        slug: "spring",
        logoUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      expect(normalizeLeagueSpace(league)).toEqual({
        kind: "league",
        id: "league-1",
        name: "Spring",
        logoUrl: null,
        sport: "basketball",
      });
    });
  });

  describe("buildPostItem", () => {
    it("wraps a team post with space and author names from the map", () => {
      const post: TeamPostResponse = {
        id: "post-1",
        teamId: "team-1",
        authorUserId: "user-a",
        authorRole: "MANAGER",
        title: "Hello",
        body: "World",
        scope: "Everyone",
        createdAt: "2026-04-01T12:00:00.000Z",
      };
      const space = normalizeTeamSpace({
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      const item = buildPostItem(post, space, { "user-a": "Alex Coach" });

      expect(item.kind).toBe("post");
      expect(item.id).toBe("post-1");
      expect(item.space).toEqual(space);
      expect(item.post.title).toBe("Hello");
      expect(item.post.authorName).toBe("Alex Coach");
    });
  });

  describe("buildMatchItem", () => {
    const teamMap: Record<string, TeamSummaryResponse> = {
      home: {
        id: "home",
        name: "Home Side",
        sport: "basketball",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      away: {
        id: "away",
        name: "Away Side",
        sport: "basketball",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    };

    const baseMatch: TeamMatch = {
      id: "match-1",
      matchType: "TEAM_MATCH",
      status: "CONFIRMED",
      homeTeamId: "home",
      awayTeamId: "away",
      sport: "basketball",
      startTime: "2099-05-01T10:00:00.000Z",
      endTime: "2099-05-01T11:00:00.000Z",
      requiresReferee: false,
      createdByUserId: "user-1",
      createdAt: "2026-04-01T09:00:00.000Z",
      updatedAt: "2026-04-01T09:00:00.000Z",
    };

    it("uses Team Match as context for team space", () => {
      const space = normalizeTeamSpace(teamMap.home);
      const item = buildMatchItem(baseMatch, space, teamMap);
      expect(item.contextLabel).toBe("Team Match");
      expect(item.homeName).toBe("Home Side");
      expect(item.awayName).toBe("Away Side");
    });

    it("uses league name as context for league space", () => {
      const league: LeagueSummaryResponse = {
        id: "league-1",
        name: "Metro League",
        sport: "basketball",
        slug: "metro",
        logoUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      const space = normalizeLeagueSpace(league);
      const item = buildMatchItem(baseMatch, space, teamMap);
      expect(item.contextLabel).toBe("Metro League");
    });

    it("marks status COMPLETED when both scores are present", () => {
      const space = normalizeTeamSpace(teamMap.home);
      const item = buildMatchItem(
        { ...baseMatch, homeScore: 10, awayScore: 8 },
        space,
        teamMap,
      );
      expect(item.status).toBe("COMPLETED");
      expect(item.homeScore).toBe(10);
      expect(item.awayScore).toBe(8);
    });

    it("falls back to default team names when summaries are missing", () => {
      const space = normalizeTeamSpace(teamMap.home);
      const item = buildMatchItem(
        {
          ...baseMatch,
          homeTeamId: "unknown-home",
          awayTeamId: "unknown-away",
        },
        space,
        {},
      );
      expect(item.homeName).toBe("Home Team");
      expect(item.awayName).toBe("Away Team");
    });
  });

  describe("buildHomeItems", () => {
    it("assembles team and league feed buckets with league fallback space", () => {
      const teamSpace = normalizeTeamSpace({
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      const items = buildHomeItems({
        teamPostBuckets: [
          {
            space: teamSpace,
            posts: [
              {
                id: "team-post-1",
                teamId: "team-1",
                authorUserId: "user-a",
                authorRole: "MANAGER",
                title: "Team update",
                body: "Body",
                scope: "Everyone",
                createdAt: "2026-04-01T12:00:00.000Z",
              },
            ],
          },
        ],
        leaguePostBuckets: [
          {
            leagueId: "league-1",
            posts: [
              {
                id: "league-post-1",
                leagueId: "league-1",
                authorUserId: "user-b",
                title: "League update",
                body: "Body",
                scope: "Everyone",
                createdAt: "2026-04-01T13:00:00.000Z",
              },
            ],
          },
        ],
        teamMatchBuckets: [
          {
            space: teamSpace,
            matches: [
              {
                id: "team-match-1",
                matchType: "TEAM_MATCH",
                status: "CONFIRMED",
                homeTeamId: "team-1",
                awayTeamId: "team-2",
                sport: "basketball",
                startTime: "2099-05-01T10:00:00.000Z",
                endTime: "2099-05-01T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-1",
                createdAt: "2026-04-01T14:00:00.000Z",
                updatedAt: "2026-04-01T14:00:00.000Z",
              },
            ],
          },
        ],
        leagueMatchBuckets: [
          {
            leagueId: "league-missing",
            matches: [
              {
                id: "league-match-1",
                leagueId: "league-missing",
                status: "CONFIRMED",
                homeTeamId: "team-2",
                awayTeamId: "team-1",
                sport: "basketball",
                startTime: "2099-05-02T10:00:00.000Z",
                endTime: "2099-05-02T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-1",
                createdAt: "2026-04-01T15:00:00.000Z",
                updatedAt: "2026-04-01T15:00:00.000Z",
              },
            ],
          },
        ],
        userNameMap: {
          "user-a": "Alex Coach",
          "user-b": "Bailey Admin",
        },
        leagueSummaryMap: {
          "league-1": {
            id: "league-1",
            name: "Metro League",
            sport: "basketball",
            slug: "metro-league",
            logoUrl: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
        teamSummaryMap: {
          "team-1": {
            id: "team-1",
            name: "Raptors",
            sport: "basketball",
            archived: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
          "team-2": {
            id: "team-2",
            name: "Wolves",
            sport: "basketball",
            archived: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      });

      expect(items.map((item) => item.id)).toEqual([
        "team-post-1",
        "league-post-1",
        "team-match-1",
        "league-match-1",
      ]);
      expect(items[1]).toEqual(
        expect.objectContaining({
          kind: "post",
          space: expect.objectContaining({
            kind: "league",
            id: "league-1",
            name: "Metro League",
          }),
        }),
      );
      expect(items[3]).toEqual(
        expect.objectContaining({
          kind: "match",
          contextLabel: "League",
          space: expect.objectContaining({
            kind: "league",
            id: "league-missing",
            name: "League",
          }),
        }),
      );
    });
  });

  describe("fetchFeedBuckets", () => {
    it("fetches and filters buckets for the following feed", async () => {
      const teamSpace = normalizeTeamSpace({
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      mockGet.mockImplementation(async (url: string) => {
        if (url === GO_TEAM_SERVICE_ROUTES.TEAM_POSTS("team-1")) {
          return {
            data: {
              posts: [
                {
                  id: "members-post",
                  teamId: "team-1",
                  authorUserId: "user-a",
                  authorRole: "MANAGER",
                  title: "Members",
                  body: "Secret",
                  scope: "Members",
                  createdAt: "2026-04-01T10:00:00.000Z",
                },
                {
                  id: "public-post",
                  teamId: "team-1",
                  authorUserId: "user-a",
                  authorRole: "MANAGER",
                  title: "Public",
                  body: "Hello",
                  scope: "Everyone",
                  createdAt: "2026-04-01T11:00:00.000Z",
                },
              ],
            },
          };
        }
        if (url === GO_TEAM_SERVICE_ROUTES.MATCHES("team-1")) {
          return {
            data: [
              {
                id: "team-match",
                matchType: "TEAM_MATCH",
                status: "CONFIRMED",
                homeTeamId: "team-1",
                awayTeamId: "team-2",
                sport: "basketball",
                startTime: "2099-05-01T10:00:00.000Z",
                endTime: "2099-05-01T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-1",
                createdAt: "2026-04-01T12:00:00.000Z",
                updatedAt: "2026-04-01T12:00:00.000Z",
              },
            ],
          };
        }
        if (url === GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POSTS("league-1")) {
          return {
            data: {
              items: [
                {
                  id: "league-post",
                  leagueId: "league-1",
                  authorUserId: "user-b",
                  title: "League news",
                  body: "Hi",
                  scope: "Everyone",
                  createdAt: "2026-04-01T13:00:00.000Z",
                },
              ],
            },
          };
        }
        if (url === GO_LEAGUE_SERVICE_ROUTES.MATCHES("league-1")) {
          return {
            data: [
              {
                id: "league-match",
                leagueId: "league-1",
                status: "CONFIRMED",
                homeTeamId: "team-2",
                awayTeamId: "team-3",
                sport: "basketball",
                startTime: "2099-05-02T10:00:00.000Z",
                endTime: "2099-05-02T11:00:00.000Z",
                requiresReferee: false,
                createdByUserId: "user-1",
                createdAt: "2026-04-01T14:00:00.000Z",
                updatedAt: "2026-04-01T14:00:00.000Z",
              },
            ],
          };
        }

        throw new Error(`Unexpected GET ${url}`);
      });

      const buckets = await fetchFeedBuckets({
        api: mockApi,
        teamSpaces: [teamSpace],
        leagueIds: ["league-1"],
        onlyEveryonePosts: true,
        label: "following feed",
        log,
      });

      expect(buckets.teamPostBuckets[0]?.posts.map((post) => post.id)).toEqual([
        "public-post",
      ]);
      expect(
        buckets.leaguePostBuckets[0]?.posts.map((post) => post.id),
      ).toEqual(["league-post"]);
      expect(buckets.teamMatchBuckets[0]?.matches).toHaveLength(1);
      expect(buckets.leagueMatchBuckets[0]?.matches).toHaveLength(1);
      expect(mockGet).toHaveBeenCalledWith(
        GO_TEAM_SERVICE_ROUTES.TEAM_POSTS("team-1"),
        { params: { page: 0, size: 50 } },
      );
    });

    it("logs and drops rejected bucket requests", async () => {
      const teamSpace = normalizeTeamSpace({
        id: "team-1",
        name: "Raptors",
        sport: "basketball",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });

      mockGet.mockRejectedValue(new Error("down"));

      const buckets = await fetchFeedBuckets({
        api: mockApi,
        teamSpaces: [teamSpace],
        leagueIds: ["league-1"],
        onlyEveryonePosts: false,
        label: "feed",
        log,
      });

      expect(buckets).toEqual({
        teamPostBuckets: [],
        leaguePostBuckets: [],
        teamMatchBuckets: [],
        leagueMatchBuckets: [],
      });
      expect(log.warn).toHaveBeenCalledWith(
        "Failed to fetch team posts for feed",
        expect.any(Error),
      );
      expect(log.warn).toHaveBeenCalledWith(
        "Failed to fetch team matches for feed",
        expect.any(Error),
      );
      expect(log.warn).toHaveBeenCalledWith(
        "Failed to fetch league posts for feed",
        expect.any(Error),
      );
      expect(log.warn).toHaveBeenCalledWith(
        "Failed to fetch league matches for feed",
        expect.any(Error),
      );
    });
  });

  describe("feed bucket collectors", () => {
    it("collects unique post authors and match team ids", () => {
      expect(
        collectFeedPostAuthorIds({
          teamPostBuckets: [
            {
              space: { kind: "team", id: "team-1", name: "Raptors" },
              posts: [
                {
                  id: "tp-1",
                  teamId: "team-1",
                  authorUserId: "user-a",
                  authorRole: "MANAGER",
                  title: "Team",
                  body: "Body",
                  scope: "Everyone",
                  createdAt: "2026-04-01T10:00:00.000Z",
                },
              ],
            },
          ],
          leaguePostBuckets: [
            {
              leagueId: "league-1",
              posts: [
                {
                  id: "lp-1",
                  leagueId: "league-1",
                  authorUserId: "user-a",
                  title: "League",
                  body: "Body",
                  scope: "Everyone",
                  createdAt: "2026-04-01T11:00:00.000Z",
                },
                {
                  id: "lp-2",
                  leagueId: "league-1",
                  authorUserId: "user-b",
                  title: "League 2",
                  body: "Body",
                  scope: "Everyone",
                  createdAt: "2026-04-01T12:00:00.000Z",
                },
              ],
            },
          ],
        }),
      ).toEqual(["user-a", "user-b"]);

      expect(
        collectFeedMatchTeamIds({
          teamMatchBuckets: [
            {
              space: { kind: "team", id: "team-1", name: "Raptors" },
              matches: [
                {
                  id: "tm-1",
                  matchType: "TEAM_MATCH",
                  status: "CONFIRMED",
                  homeTeamId: "team-1",
                  awayTeamId: "team-2",
                  sport: "basketball",
                  startTime: "2099-05-01T10:00:00.000Z",
                  endTime: "2099-05-01T11:00:00.000Z",
                  requiresReferee: false,
                  createdByUserId: "user-1",
                  createdAt: "2026-04-01T13:00:00.000Z",
                  updatedAt: "2026-04-01T13:00:00.000Z",
                },
              ],
            },
          ],
          leagueMatchBuckets: [
            {
              leagueId: "league-1",
              matches: [
                {
                  id: "lm-1",
                  leagueId: "league-1",
                  status: "CONFIRMED",
                  homeTeamId: "team-2",
                  awayTeamId: "team-3",
                  sport: "basketball",
                  startTime: "2099-05-02T10:00:00.000Z",
                  endTime: "2099-05-02T11:00:00.000Z",
                  requiresReferee: false,
                  createdByUserId: "user-1",
                  createdAt: "2026-04-01T14:00:00.000Z",
                  updatedAt: "2026-04-01T14:00:00.000Z",
                },
              ],
            },
          ],
        }),
      ).toEqual(["team-1", "team-2", "team-3"]);
    });
  });

  describe("fetchTeamSummaryMap", () => {
    it("returns only seeded teams when all ids are already known", async () => {
      const t1: TeamSummaryResponse = {
        id: "t1",
        name: "One",
        archived: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      const map = await fetchTeamSummaryMap(mockApi, [t1], ["t1"], log);
      expect(map).toEqual({ t1 });
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("GETs missing team ids and merges into the map", async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          id: "t2",
          name: "Fetched",
          sport: "soccer",
          archived: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      });

      const map = await fetchTeamSummaryMap(mockApi, [], ["t2"], log);

      expect(mockGet).toHaveBeenCalledWith(`${GO_TEAM_SERVICE_ROUTES.ALL}/t2`);
      expect(map.t2?.name).toBe("Fetched");
    });

    it("warns and uses placeholder when a team GET fails", async () => {
      mockGet.mockRejectedValueOnce(new Error("404"));

      const map = await fetchTeamSummaryMap(mockApi, [], ["missing"], log);

      expect(log.warn).toHaveBeenCalledWith(
        "Failed to fetch team summary for feed",
        expect.objectContaining({ teamId: "missing" }),
      );
      expect(map.missing?.name).toBe("Team");
      expect(map.missing?.id).toBe("missing");
    });
  });

  describe("fetchLeagueSummaryMap", () => {
    it("returns an empty object when there are no league ids", async () => {
      await expect(fetchLeagueSummaryMap(mockApi, [], log)).resolves.toEqual(
        {},
      );
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("GETs each league and maps by id", async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          id: "L1",
          name: "League One",
          sport: "basketball",
          slug: "l1",
          logoUrl: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      });

      const map = await fetchLeagueSummaryMap(mockApi, ["L1"], log);

      expect(mockGet).toHaveBeenCalledWith(GO_LEAGUE_SERVICE_ROUTES.GET("L1"));
      expect(map.L1?.name).toBe("League One");
    });

    it("warns and uses minimal league when GET fails", async () => {
      mockGet.mockRejectedValueOnce(new Error("gone"));

      const map = await fetchLeagueSummaryMap(mockApi, ["bad"], log);

      expect(log.warn).toHaveBeenCalledWith(
        "Failed to fetch league summary for feed",
        expect.objectContaining({ leagueId: "bad" }),
      );
      expect(map.bad).toEqual(
        expect.objectContaining({ id: "bad", name: "League", logoUrl: null }),
      );
    });
  });
});
