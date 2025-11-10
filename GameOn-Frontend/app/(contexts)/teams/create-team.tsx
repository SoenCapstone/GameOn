import React, { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import PickerModal, { Option } from "@/components/ui/pickerModal";
import { createTeamStyles as styles } from "../../../components/teams/teams-styles";
import { ContentArea } from "@/components/ui/content-area";
import { TeamLogoSection } from "@/components/teams/logo-picker";
import { TeamNameField } from "@/components/teams/name-field";
import { TeamDetailsCard } from "@/components/teams/details-card";
import { TeamVisibilitySection } from "@/components/teams/visibility";

type PickerType = "sport" | "scope" | "city";

export default function CreateTeamScreen() {
  const router = useRouter();

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

  const handleCreateTeam = () => {
    console.log("Create team payload:", {
      teamName,
      sportId: selectedSport?.id,
      scopeId: selectedScope.id,
      cityId: selectedCity?.id,
      isPublic,
      logoUri,
    });
    router.back();
  };

  return (
    <ContentArea
      backgroundProps={{ preset: "purple" }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TeamLogoSection
          value={logoUri}
          onChange={setLogoUri}
        />

        <TeamNameField
          teamName={teamName}
          onChangeTeamName={setTeamName}
        />

        <TeamDetailsCard
          sportLabel={sportLabel}
          scopeLabel={scopeLabel}
          cityLabel={cityLabel}
          onOpenPicker={setOpenPicker}
        />

        <TeamVisibilitySection
          isPublic={isPublic}
          onChangePublic={setIsPublic}
        />

        <Pressable style={styles.createButton} onPress={handleCreateTeam}>
          <Text style={styles.createButtonText}>Create Team</Text>
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
      </ScrollView>
    </ContentArea>
  );
}
