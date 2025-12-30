import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import PickerModal, { Option } from "@/components/ui/pickerModal";
import { createTeamStyles as styles } from "../../../components/teams/teams-styles";
import { ContentArea } from "@/components/ui/content-area";
import { TeamLogoSection } from "@/components/teams/logo-picker";
import { TeamNameField } from "@/components/teams/name-field";
import { TeamDetailsCard } from "@/components/teams/details-card";
import { TeamVisibilitySection } from "@/components/teams/visibility";
import { createScopedLog } from "@/utils/logger";
import { useMutation } from "@tanstack/react-query";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";

const log = createScopedLog("Create Team Page");

type PickerType = "sport" | "scope" | "city";

export default function CreateTeamScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();

  const SCOPE_OPTIONS: Option[] = [
    { id: "casual", label: "Casual" },
    { id: "managed", label: "Managed" },
    { id: "league_ready", label: "League Ready" },
  ];

  const MOCK_SPORTS: Option[] = [
    { id: "soccer", label: "Soccer" },
    { id: "basketball", label: "Basketball" },
    { id: "volleyball", label: "Volleyball" },
  ];

  const MOCK_CITIES: Option[] = [
    { id: "mtl", label: "Montreal" },
    { id: "tor", label: "Toronto" },
    { id: "van", label: "Vancouver" },
  ];

  const [teamName, setTeamName] = useState("");
  const [selectedSport, setSelectedSport] = useState<Option | null>(null);
  const [selectedScope, setSelectedScope] = useState<Option>(SCOPE_OPTIONS[0]);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [openPicker, setOpenPicker] = useState<PickerType | null>(null);

  const sportLabel = selectedSport?.label ?? "None";
  const scopeLabel = selectedScope.label;
  const cityLabel = selectedCity?.label ?? "City";

  const pickerConfig: Record<
    PickerType,
    { title: string; options: Option[]; setter: (option: Option) => void }
  > = {
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
  };

  const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: teamName.trim(),
        sport: selectedSport?.id ?? "",
        scope: selectedScope?.id ?? "",
        logoUrl: logoUri ?? "",
        privacy: isPublic ? "PUBLIC" : "PRIVATE",
      };
      log.info("Sending team creation payload:", payload);
      const resp = await api.post(GO_TEAM_SERVICE_ROUTES.CREATE, payload);
      return resp.data as { id: string; slug: string };
    },
    onSuccess: (data) => {
      log.info("Team created:", data);
      router.replace(`/teams/${data.id}`);
    },
    onError: (err) => {
      log.error("Create team failed", errorToString(err));
    },
  });

  const handleCreateTeam = () => {
    if (!teamName.trim()) {
      log.warn("Team name is required");
      return;
    }
    if (!selectedSport) {
      log.warn("Sport is required");
      return;
    }
    if (!selectedCity) {
      log.warn("City is required");
      return;
    }
    createTeamMutation.mutate();
  };

  return (
    <ContentArea scrollable backgroundProps={{ preset: "purple" }}>
      <TeamLogoSection value={logoUri} onChange={setLogoUri} />

      <TeamNameField teamName={teamName} onChangeTeamName={setTeamName} />

      <TeamDetailsCard
        sportLabel={sportLabel}
        scopeLabel={scopeLabel}
        cityLabel={cityLabel}
        onOpenPicker={setOpenPicker}
      />

      <TeamVisibilitySection isPublic={isPublic} onChangePublic={setIsPublic} />

      <Pressable
        style={styles.createButton}
        onPress={handleCreateTeam}
        disabled={createTeamMutation.isPending}
      >
        <Text style={styles.createButtonText}>
          {createTeamMutation.isPending ? "Creating..." : "Create Team"}
        </Text>
      </Pressable>

      <PickerModal
        visible={openPicker !== null}
        title={currentConfig?.title ?? ""}
        options={currentConfig?.options ?? []}
        onClose={() => setOpenPicker(null)}
        onSelect={(option) => {
          if (!openPicker) return;
          pickerConfig[openPicker].setter(option);
          setOpenPicker(null);
        }}
      />
    </ContentArea>
  );
}
