import { useState, useEffect } from "react";
import {
  Option,
  LeaguePickerType,
  LEVEL_OPTIONS,
  SPORTS,
} from "@/constants/form-constants";

interface UseLeagueFormProps {
  initialData?: {
    name?: string;
    sport?: string;
    region?: string;
    location?: string;
    level?: string;
    privacy?: string;
  };
}

export const useLeagueForm = (props?: UseLeagueFormProps) => {
  const [leagueName, setLeagueName] = useState("");
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Option | null>(null);
  const [region, setRegion] = useState(props?.initialData?.region ?? "");
  const [location, setLocation] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [openPicker, setOpenPicker] = useState<LeaguePickerType | null>(null);

  useEffect(() => {
    if (props?.initialData) {
      const data = props.initialData;
      setLeagueName(data.name || "");
      setRegion(data.region || "");
      setLocation(data.location || "");
      setIsPublic(data.privacy === "PUBLIC");

      const sportOption = SPORTS.find(
        (s) => s.label.toLowerCase() === data.sport?.toLowerCase(),
      );
      if (sportOption) {
        setSelectedSport(sportOption);
      }

      const levelOption = LEVEL_OPTIONS.find(
        (level) => level.id === data.level,
      );
      if (levelOption) {
        setSelectedLevel(levelOption);
      }
    }
  }, [props?.initialData]);

  return {
    leagueName,
    setLeagueName,
    selectedSport,
    setSelectedSport,
    selectedLevel,
    setSelectedLevel,
    region,
    setRegion,
    location,
    setLocation,
    isPublic,
    setIsPublic,
    openPicker,
    setOpenPicker,
  };
};
