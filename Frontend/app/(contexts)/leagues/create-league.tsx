import React from "react";
import { Pressable, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import PickerModal from "@/components/ui/pickerModal";
import { ContentArea } from "@/components/ui/content-area";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import {
  useAxiosWithClerk,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createTeamStyles as styles } from "@/components/teams/teams-styles";
import { LeagueNameField } from "@/components/leagues/league-name-field";
import { LeagueDetailsCard } from "@/components/leagues/league-details-card";
import { useLeagueForm } from "@/hooks/use-league-form";
import { getLeaguePickerConfig } from "@/components/leagues/league-form-constants";

const log = createScopedLog("Create League Page");

export default function CreateLeagueScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  const {
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
    openPicker,
    setOpenPicker,
  } = useLeagueForm();

  const sportLabel = selectedSport?.label ?? "None";
  const levelLabel = selectedLevel?.label ?? "Optional";

  const pickerConfig = getLeaguePickerConfig(setSelectedSport, setSelectedLevel);
  const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

  const createLeagueMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: leagueName.trim(),
        sport: selectedSport?.id ?? "",
        region: region.trim() || undefined,
        location: location.trim() || undefined,
        level: selectedLevel?.id ?? undefined,
        privacy: "PRIVATE", // ✅ always private on create
      };

      log.info("Sending league creation payload:", payload);
      const resp = await api.post(GO_LEAGUE_SERVICE_ROUTES.CREATE, payload);
      return resp.data as { id: string; slug: string };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
      Alert.alert(
        "League created",
        "Your league has been created successfully.",
      );
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create league failed", message);
      Alert.alert("League creation failed", message);
    },
  });

  const handleCreateLeague = () => {
    if (!leagueName.trim()) {
      Alert.alert("League creation failed", "League name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("League creation failed", "Sport is required");
      return;
    }

    createLeagueMutation.mutate();
  };

  return (
    <ContentArea scrollable backgroundProps={{ preset: "purple" }}>
      <LeagueNameField leagueName={leagueName} onChangeLeagueName={setLeagueName} />

      <LeagueDetailsCard
        sportLabel={sportLabel}
        levelLabel={levelLabel}
        region={region}
        location={location}
        onChangeRegion={setRegion}
        onChangeLocation={setLocation}
        onOpenPicker={(type) => setOpenPicker(type)}
      />

      <Pressable
        style={styles.createButton}
        onPress={handleCreateLeague}
        disabled={createLeagueMutation.isPending}
      >
        <Text style={styles.createButtonText}>
          {createLeagueMutation.isPending ? "Creating..." : "Create League"}
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
