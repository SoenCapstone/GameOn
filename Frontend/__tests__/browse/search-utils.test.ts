import {
  getSportLogo,
  fetchTeamResults,
  fetchLeagueResults,
  onSearchResultPress,
} from "@/utils/search";
import { images } from "@/constants/images";

import axios from "axios";
import { createScopedLog } from "@/utils/logger";
import { router } from "expo-router";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
  },
}));

describe("getSportLogo", () => {
  it("returns correct logo image for known sports and default for unknown", () => {
    expect(getSportLogo("soccer")).toBe(images.soccerLogo);
    expect(getSportLogo("basketball")).toBe(images.basketballLogo);
    expect(getSportLogo("volleyball")).toBe(images.volleyballLogo);
    expect(getSportLogo("quidditch")).toBe(images.defaultLogo);
    expect(getSportLogo("")).toBe(images.defaultLogo);
    expect(getSportLogo()).toBe(images.defaultLogo);
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
    } as unknown as import("axios").AxiosInstance;
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
  it("handles empty query and member params", async () => {
    mockedAxios.get.mockClear();
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as unknown as import("axios").AxiosInstance;
    await fetchTeamResults(fakeApi, "", true);
    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[1]!.params).toMatchObject({ size: "50", my: true });
    expect(callArgs[1]!.params.q).toBeUndefined();
  });
  it("adds sport when provided", async () => {
    mockedAxios.get.mockClear();
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as unknown as import("axios").AxiosInstance;
    await fetchTeamResults(fakeApi, "Test", false, "Basketball");
    const callArgs = mockedAxios.get.mock.calls[0];
    expect(callArgs[1]!.params).toMatchObject({
      size: "50",
      q: "Test",
      sport: "Basketball",
    });
  });

  it("logs and rethrows when fetchTeamResults fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("boom"));
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as unknown as import("axios").AxiosInstance;

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

  it("sends params for query and member", async () => {
    const fakeApi = {
      get: mockedAxios.get,
      defaults: { headers: { common: {} } },
    } as unknown as import("axios").AxiosInstance;
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
    } as unknown as import("axios").AxiosInstance;

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

describe("onSearchResultPress", () => {
  const base = {
    name: "X",
    subtitle: "",
    sport: "soccer",
    logo: images.soccerLogo,
    location: "",
  };

  beforeEach(() => {
    jest.mocked(router.push).mockClear();
  });

  it("pushes team and league routes", () => {
    onSearchResultPress({ ...base, id: "t1", type: "team" });
    expect(router.push).toHaveBeenLastCalledWith("/teams/t1");

    onSearchResultPress({ ...base, id: "l9", type: "league" });
    expect(router.push).toHaveBeenLastCalledWith("/leagues/l9");
  });

  it("does not navigate for tournament results", () => {
    onSearchResultPress({ ...base, id: "x", type: "tournament" });
    expect(router.push).not.toHaveBeenCalled();
  });
});
