import { cityOptions } from "@/constants/form-constants";
import type { ExploreMatchesFilter } from "@/types/explore";
export { sportOptions as exploreSportOptions } from "@/constants/form-constants";

export const exploreMatchesQueryKey = ["explore-matches"] as const;

export const filterOptions: readonly {
  value: ExploreMatchesFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "league", label: "League Match" },
  { value: "team", label: "Team Match" },
];

export const exploreLocationOptions = [...cityOptions, "My Location"];

export const exploreRangeOptions = [
  { value: 5, label: "5km", delta: 0.05 },
  { value: 10, label: "10km", delta: 0.1 },
  { value: 25, label: "25km", delta: 0.25 },
  { value: 50, label: "50km", delta: 0.5 },
] as const;

export const defaultExplorePreferences = {
  sport: "Soccer",
  location: "Montreal",
  rangeKm: 10,
  delta: 0.1,
  coordinates: { latitude: 45.50164711536332, longitude: -73.56759108404286 },
} as const;

export const cityCoordinates: Record<
  string,
  { latitude: number; longitude: number }
> = {
  Montreal: { latitude: 45.50164711536332, longitude: -73.56759108404286 },
  Toronto: { latitude: 43.65391000329953, longitude: -79.38046343249734 },
  Vancouver: { latitude: 49.28259387170229, longitude: -123.12098623662602 },
};
