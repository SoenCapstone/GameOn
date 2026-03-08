import { useState, useEffect } from "react";
import {
  Option,
  SCOPE_OPTIONS,
  SPORTS,
  CITIES,
  PickerType,
} from "@/constants/form-constants";

export interface TeamFormData {
  teamName: string;
  selectedSport: Option | null;
  selectedScope: Option;
  selectedCity: Option | null;
  logoUri: string | null;
  isPublic: boolean;
  openPicker: PickerType | null;
}

interface UseTeamFormProps {
  initialData?: {
    name: string | null;
    sport?: string | null;
    scope?: string | null;
    location?: string | null;
    logoUrl?: string |null;
    privacy?: string | null;
  };
}

export const useTeamForm = (props?: UseTeamFormProps) => {
  const [teamName, setTeamName] = useState("");
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedScope, setSelectedScope] = useState<Option>(SCOPE_OPTIONS[0]);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [openPicker, setOpenPicker] = useState<PickerType | null>(null);

  useEffect(() => {
    if (props?.initialData) {
      const data = props.initialData;
      setTeamName(data.name || "");
      setLogoUri(data.logoUrl || null);
      setIsPublic(data.privacy === "PUBLIC");

      const sportOption = SPORTS.find(
        (s) => s.label.toLowerCase() === data.sport?.toLowerCase(),
      );
      if (sportOption) {
        setSelectedSport(sportOption);
      }

      const scopeOption = SCOPE_OPTIONS.find(
        (s) => s.id === data.scope?.toLowerCase(),
      );
      if (scopeOption) {
        setSelectedScope(scopeOption);
      }

      if (data.location) {
        const cityOption = CITIES.find(
          (c) => c.label.toLowerCase() === data.location?.toLowerCase(),
        );
        if (cityOption) {
          setSelectedCity(cityOption);
        }
      }
    }
  }, [props?.initialData]);

  return {
    teamName,
    setTeamName,
    selectedSport,
    setSelectedSport,
    selectedScope,
    setSelectedScope,
    selectedCity,
    setSelectedCity,
    logoUri,
    setLogoUri,
    isPublic,
    setIsPublic,
    openPicker,
    setOpenPicker,
  };
};
