import { Option } from "@/components/ui/pickerModal";

export const SCOPE_OPTIONS: Option[] = [
  { id: "casual", label: "Casual" },
  { id: "managed", label: "Managed" },
  { id: "league_ready", label: "League Ready" },
];

export const MOCK_SPORTS: Option[] = [
  { id: "soccer", label: "Soccer" },
  { id: "basketball", label: "Basketball" },
  { id: "volleyball", label: "Volleyball" },
];

export const MOCK_CITIES: Option[] = [
  { id: "mtl", label: "Montreal" },
  { id: "tor", label: "Toronto" },
  { id: "van", label: "Vancouver" },
];

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
    options: MOCK_SPORTS,
    setter: setSelectedSport,
  },
  scope: {
    title: "Select Scope",
    options: SCOPE_OPTIONS,
    setter: setSelectedScope,
  },
  city: {
    title: "Select City",
    options: MOCK_CITIES,
    setter: setSelectedCity,
  },
});
