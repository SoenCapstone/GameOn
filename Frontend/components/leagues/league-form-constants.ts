import { Option } from "@/components/ui/pickerModal";
import { SPORTS } from "@/components/teams/team-form-constants";

export const LEVEL_OPTIONS: Option[] = [
  { id: "RECREATIONAL", label: "Recreational" },
  { id: "COMPETITIVE", label: "Competitive" },
  { id: "YOUTH", label: "Youth" },
  { id: "AMATEUR", label: "Amateur" },
  { id: "PROFESSIONAL", label: "Professional" },
];

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
