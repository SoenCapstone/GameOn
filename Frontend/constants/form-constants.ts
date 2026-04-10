export type Option = { id: string; label: string };

export const sports: Option[] = [
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "volleyball", label: "Volleyball" },
];

export const scopes: Option[] = [
  { id: "casual", label: "Casual" },
  { id: "managed", label: "Managed" },
  { id: "league_ready", label: "League Ready" },
];

export const cities: Option[] = [
  { id: "mtl", label: "Montreal" },
  { id: "tor", label: "Toronto" },
  { id: "van", label: "Vancouver" },
];

export const levels: Option[] = [
  { id: "RECREATIONAL", label: "Recreational" },
  { id: "COMPETITIVE", label: "Competitive" },
  { id: "YOUTH", label: "Youth" },
  { id: "AMATEUR", label: "Amateur" },
  { id: "PROFESSIONAL", label: "Professional" },
];

export const sportOptions = sports.map((o) => o.label);
export const scopeOptions = scopes.map((o) => o.label);
export const cityOptions = cities.map((o) => o.label);
export const levelOptions = levels.map((o) => o.label);

export const getSportByLabel = (label: string) =>
  sports.find((x) => x.label === label);
export const getScopeByLabel = (label: string) =>
  scopes.find((x) => x.label === label);
export const getCityByLabel = (label: string) =>
  cities.find((x) => x.label === label);
export const getLevelByLabel = (label: string) =>
  levels.find((x) => x.label === label);

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
    options: sports,
    setter: setSelectedSport,
  },
  scope: {
    title: "Select Scope",
    options: scopes,
    setter: setSelectedScope,
  },
  city: {
    title: "Select City",
    options: cities,
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
    options: sports,
    setter: setSelectedSport,
  },
  level: {
    title: "Select Level",
    options: levels,
    setter: setSelectedLevel,
  },
});
