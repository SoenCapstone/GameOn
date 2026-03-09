import { useEffect, useState } from "react";
import {
  CITIES,
  Option,
  PickerType,
  SCOPE_OPTIONS,
  SPORTS,
} from "@/constants/form-constants";
import type { TeamDetailResponse } from "@/hooks/use-team-detail";

interface UseTeamFormProps {
  initialData?: TeamDetailResponse;
}

export const useTeamForm = (props?: UseTeamFormProps) => {
  const [teamName, setTeamName] = useState("");
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedScope, setSelectedScope] = useState<Option>(SCOPE_OPTIONS[0]);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);
  const [selectedAllowedRegions, setSelectedAllowedRegions] = useState<string[]>(
    [],
  );
  const [allowedRegionsManuallyEdited, setAllowedRegionsManuallyEdited] =
    useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [openPicker, setOpenPicker] = useState<PickerType | null>(null);

  useEffect(() => {
    if (!props?.initialData) return;

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

    const normalizedAllowedRegions = (data.allowedRegions ?? [])
      .map((region) => region?.trim())
      .filter((region): region is string => Boolean(region));

    if (normalizedAllowedRegions.length > 0) {
      setSelectedAllowedRegions(normalizedAllowedRegions);
      setAllowedRegionsManuallyEdited(true);
    } else if (data.location) {
      setSelectedAllowedRegions([data.location]);
      setAllowedRegionsManuallyEdited(false);
    }
  }, [props?.initialData]);

  const updateSelectedAllowedRegions = (regions: string[]) => {
    setAllowedRegionsManuallyEdited(true);
    setSelectedAllowedRegions(regions);
  };

  const updateSelectedCity = (city: Option | null) => {
    setSelectedCity(city);

    if (!city) return;

    if (!allowedRegionsManuallyEdited) {
      setSelectedAllowedRegions([city.label]);
    }
  };

  return {
    teamName,
    setTeamName,
    selectedSport,
    setSelectedSport,
    selectedScope,
    setSelectedScope,
    selectedCity,
    setSelectedCity: updateSelectedCity,
    selectedAllowedRegions,
    setSelectedAllowedRegions: updateSelectedAllowedRegions,
    logoUri,
    setLogoUri,
    isPublic,
    setIsPublic,
    openPicker,
    setOpenPicker,
  };
};
