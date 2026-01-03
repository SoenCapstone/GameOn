import React, { useLayoutEffect } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { TeamLogoSection } from "@/components/teams/logo-picker";
import { TeamNameField } from "@/components/teams/name-field";
import { TeamDetailsCard } from "@/components/teams/details-card";
import { TeamVisibilitySection } from "@/components/teams/visibility";
import PickerModal from "@/components/ui/pickerModal";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
import { getPickerConfig } from "@/components/teams/team-form-constants";

const log = createScopedLog("Team Settings");

interface SettingsHeaderProps {
  onSave: () => void;
  isSaveEnabled: boolean;
  isSaving: boolean;
}

function SettingsHeader({
  onSave,
  isSaveEnabled,
  isSaving,
}: SettingsHeaderProps) {
  const isDisabled = !isSaveEnabled || isSaving;

  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title="Team Settings" />}
      right={
        <Pressable
          onPress={() => !isDisabled && onSave()}
          disabled={isDisabled}
          style={{
            backgroundColor: isSaveEnabled && !isSaving ? "#0052ff" : "#cccccc",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      }
    />
  );
}

export default function TeamSettingsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch team:", err);
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const {
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
  } = useTeamForm({
    initialData: team,
  });

  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: teamName.trim(),
        sport: selectedSport?.id ?? "",
        scope: selectedScope?.id ?? "",
        logoUrl: logoUri ?? "",
        location: selectedCity?.label ?? "",
        privacy: isPublic ? "PUBLIC" : "PRIVATE",
      };
      log.info("Sending team update payload:", payload);
      const resp = await api.patch(
        `${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`,
        payload,
      );
      return resp.data;
    },
    onSuccess: () => {
      log.info("Team updated successfully");
      router.back();
    },
    onError: (err) => {
      log.error("Update team failed", errorToString(err));
    },
  });

  const sportLabel = selectedSport?.label ?? "None";
  const scopeLabel = selectedScope.label;
  const cityLabel = selectedCity?.label ?? "City";

  const hasChanges =
    teamName !== (team?.name ?? "") ||
    selectedSport?.label?.toLowerCase() !== team?.sport?.toLowerCase() ||
    selectedScope?.id?.toLowerCase() !== team?.scope?.toLowerCase() ||
    selectedCity?.label?.toLowerCase() !== team?.location?.toLowerCase() ||
    logoUri !== (team?.logoUrl ?? "") ||
    isPublic !== (team?.privacy === "PUBLIC");

  const pickerConfig = getPickerConfig(
    setSelectedSport,
    setSelectedScope,
    setSelectedCity,
  );

  const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

  useLayoutEffect(() => {
    const handleUpdateTeam = () => {
      if (!teamName.trim()) {
        Alert.alert("Team update failed", "Team name is required");
        return;
      }
      updateTeamMutation.mutate();
    };

    navigation.setOptions({
      headerTitle: () => (
        <SettingsHeader
          onSave={handleUpdateTeam}
          isSaveEnabled={hasChanges}
          isSaving={updateTeamMutation.isPending}
        />
      ),
    });
  }, [
    navigation,
    hasChanges,
    updateTeamMutation.isPending,
    updateTeamMutation,
    teamName,
    selectedSport,
    selectedCity,
  ]);

  if (teamLoading) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </ContentArea>
    );
  }

  if (!team) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <Text style={settingsStyles.errorText}>Team not found</Text>
        </View>
      </ContentArea>
    );
  }

  return (
    <>
      <ContentArea scrollable backgroundProps={{ preset: "purple" }}>
        <TeamLogoSection value={logoUri} onChange={setLogoUri} />

        <TeamNameField teamName={teamName} onChangeTeamName={setTeamName} />

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
    </>
  );
}

const settingsStyles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  },
});
