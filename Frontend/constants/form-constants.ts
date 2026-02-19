import type { Option } from "@/components/ui/pickerModal";

export type { Option };

export const SPORTS: Option[] = [
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "volleyball", label: "Volleyball" },
];

export const SCOPE_OPTIONS: Option[] = [
  { id: "casual", label: "Casual" },
  { id: "managed", label: "Managed" },
  { id: "league_ready", label: "League Ready" },
];

export const CITIES: Option[] = [
  { id: "mtl", label: "Montreal" },
  { id: "tor", label: "Toronto" },
  { id: "van", label: "Vancouver" },
];

export const LEVEL_OPTIONS: Option[] = [
  { id: "RECREATIONAL", label: "Recreational" },
  { id: "COMPETITIVE", label: "Competitive" },
  { id: "YOUTH", label: "Youth" },
  { id: "AMATEUR", label: "Amateur" },
  { id: "PROFESSIONAL", label: "Professional" },
];

export const sportOptions = SPORTS.map((o) => o.label);
export const scopeOptions = SCOPE_OPTIONS.map((o) => o.label);
export const cityOptions = CITIES.map((o) => o.label);
export const levelOptions = LEVEL_OPTIONS.map((o) => o.label);

export const getSportByLabel = (label: string) =>
  SPORTS.find((x) => x.label === label);
export const getScopeByLabel = (label: string) =>
  SCOPE_OPTIONS.find((x) => x.label === label);
export const getCityByLabel = (label: string) =>
  CITIES.find((x) => x.label === label);
export const getLevelByLabel = (label: string) =>
  LEVEL_OPTIONS.find((x) => x.label === label);

export type PickerType = "sport" | "scope" | "city";

export const getPickerConfig = (
  setSelectedSport: (option: Option) => void,
  setSelectedScope: (option: Option) => void,
  setSelectedCity: (option: Option) => void,
): Record<
  PickerType,
  { title: string; options: Option[]; setter: (option: Option) => void }
> => ({
  sport: {
    title: "Select Sport",
    options: SPORTS,
    setter: setSelectedSport,
  },
  scope: {
    title: "Select Scope",
    options: SCOPE_OPTIONS,
    setter: setSelectedScope,
  },
  city: {
    title: "Select City",
    options: CITIES,
    setter: setSelectedCity,
  },
});

export type LeaguePickerType = "sport" | "level";

export const getLeaguePickerConfig = (
  setSelectedSport: (option: Option) => void,
  setSelectedLevel: (option: Option) => void,
): Record<
  LeaguePickerType,
  { title: string; options: Option[]; setter: (option: Option) => void }
> => ({
  sport: {
    title: "Select Sport",
    options: SPORTS,
    setter: setSelectedSport,
  },
  level: {
    title: "Select Level",
    options: LEVEL_OPTIONS,
    setter: setSelectedLevel,
  },
});
