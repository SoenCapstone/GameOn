import { buildExploreMatchesQueryKey } from "@/utils/explore";

describe("buildExploreMatchesQueryKey", () => {
  it("includes filter, sport or all placeholder, and coordinates", () => {
    expect(
      buildExploreMatchesQueryKey(
        {
          latitude: 43.65,
          longitude: -79.38,
          rangeKm: 10,
          sport: "soccer",
        },
        "all",
      ),
    ).toEqual(["explore-matches", "all", "soccer", 43.65, -79.38, 10]);

    expect(
      buildExploreMatchesQueryKey({
        latitude: 1,
        longitude: 2,
        rangeKm: 5,
      }),
    ).toEqual(["explore-matches", "all", "all", 1, 2, 5]);

    expect(
      buildExploreMatchesQueryKey(
        {
          latitude: 1,
          longitude: 2,
          rangeKm: 5,
        },
        "league",
      ),
    ).toEqual(["explore-matches", "league", "all", 1, 2, 5]);
  });
});
