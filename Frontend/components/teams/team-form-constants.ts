import { Option } from "@/components/ui/pickerModal";

export const SCOPE_OPTIONS: Option[] = [
  { id: "casual", label: "Casual" },
  { id: "managed", label: "Managed" },
  { id: "league_ready", label: "League Ready" },
];

export const SPORTS: Option[] = [
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "volleyball", label: "Volleyball" },
];

export const CITIES: Option[] = [
  { id: "mtl", label: "Montreal" },
  { id: "tor", label: "Toronto" },
  { id: "van", label: "Vancouver" },
];

export const sportOptions = SPORTS.map((o) => o.label);
export const scopeOptions = SCOPE_OPTIONS.map((o) => o.label);
export const cityOptions = CITIES.map((o) => o.label);

export const getSportByLabel = (label: string) =>
  SPORTS.find((x) => x.label === label);
export const getScopeByLabel = (label: string) =>
  SCOPE_OPTIONS.find((x) => x.label === label);
export const getCityByLabel = (label: string) =>
  CITIES.find((x) => x.label === label);

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
