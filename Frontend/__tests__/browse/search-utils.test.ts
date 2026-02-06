import {
  getSportLogo,
  fetchTeamResults,
  fetchLeagueResults,
  useTeamResults,
  useLeagueResults,
} from "@/components/browse/utils";
import { images } from "@/constants/images";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";

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

jest.mock("@/utils/logger", () => ({
  createScopedLog: jest.fn(() => ({
    warn: jest.fn(),
  })),
}));

jest.mock("@/constants/images", () => ({
  images: {
    soccerLogo: { testID: "soccer-logo" },
    basketballLogo: { testID: "basketball-logo" },
    volleyballLogo: { testID: "volleyball-logo" },
    defaultLogo: { testID: "default-logo" },
  },
}));

describe("getSportLogo", () => {
  it("returns correct logo image for known sports and default for unknown", () => {
    expect(getSportLogo("soccer")).toBe(images.soccerLogo);
    expect(getSportLogo("basketball")).toBe(images.basketballLogo);
    expect(getSportLogo("volleyball")).toBe(images.volleyballLogo);
    expect(getSportLogo("quidditch")).toBe(images.defaultLogo);
    expect(getSportLogo("")).toBe(images.defaultLogo);
    expect(getSportLogo(undefined)).toBe(images.defaultLogo);
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
  it("maps backend teams and sets query params", async () => {
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

    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[1]!.params).toMatchObject({ size: "50", q: "Test" });
  });
  it("handles empty query and onlyMine params", async () => {
    mockedAxios.get.mockClear();
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;
    await fetchTeamResults(fakeApi, "", true);
    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[1]!.params).toMatchObject({ size: "50", my: true });
    expect(callArgs[1]!.params.q).toBeUndefined();
  });

  it("logs and rethrows when fetchTeamResults fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("boom"));
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;

    await expect(fetchTeamResults(fakeApi, "fail")).rejects.toThrow("boom");
    const logMock = createScopedLog as jest.MockedFunction<
      typeof createScopedLog
    >;
    const log = logMock.mock.results[0].value;
    expect(log.warn).toHaveBeenCalledWith(
      "fetchTeamResults failed",
      expect.any(Error),
    );
  });
});

describe("fetchLeagueResults", () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({
      data: {
        items: [
          {
            id: "l1",
            name: "Test League",
            sport: "soccer",
            slug: "test-league",
            region: "Europe",
            level: "Pro",
            privacy: "PUBLIC",
            seasonCount: 2,
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

  it("sends params for query and onlyMine", async () => {
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;
    await fetchLeagueResults(fakeApi, "League", true);
    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[1]!.params).toMatchObject({
      size: "50",
      q: "League",
      my: true,
    });
  });

  it("logs and rethrows when fetchLeagueResults fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("league error"));
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as any;

    await expect(fetchLeagueResults(fakeApi, "fail")).rejects.toThrow(
      "league error",
    );
    const logMock = createScopedLog as jest.MockedFunction<
      typeof createScopedLog
    >;
    const log = logMock.mock.results[0].value;
    expect(log.warn).toHaveBeenCalledWith(
      "fetchLeagueResults failed",
      expect.any(Error),
    );
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
    expect(res.data[0].logo).toEqual({ uri: "https://logo.png" });
    expect(res.data[0].subtitle).toBe("basketball");
  });

  it("falls back to logo image and 'Team' subtitle when sport or logo missing", () => {
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
    expect(res.data[0].logo).toBe(getSportLogo(""));

    expect(res.data[1].subtitle).toBe("tennis");
    expect(res.data[1].logo).toBe(getSportLogo("tennis"));
  });
});

describe("useLeagueResults mapping", () => {
  beforeEach(() => {
    (useQuery as jest.Mock).mockReset();
    (useAxiosWithClerk as jest.Mock).mockReset();
    (useAxiosWithClerk as jest.Mock).mockReturnValue({});
  });

  it("maps league results with region and sport fallbacks", () => {
    const data = {
      items: [
        {
          id: 99,
          name: "Regional League",
          sport: "soccer",
          slug: "regional",
          region: "Europe",
          level: null,
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

    const refetch = jest.fn();
    (useQuery as jest.Mock).mockReturnValue({
      data,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch,
    });

    const res = useLeagueResults("any");
    expect(res.data).toHaveLength(3);
    expect(res.data[0].id).toBe("99");
    expect(res.data[0].subtitle).toBe("Europe");
    expect(res.data[0].location).toBe("Europe");
    expect(res.data[0].logo).toBe(getSportLogo("soccer"));

    expect(res.data[1].subtitle).toBe("tennis");
    expect(res.data[1].logo).toBe(getSportLogo("tennis"));

    expect(res.data[2].subtitle).toBe("League");
    expect(res.data[2].location).toBe("");

    return res.refetch().then(() => {
      expect(refetch).toHaveBeenCalled();
    });
  });
});
