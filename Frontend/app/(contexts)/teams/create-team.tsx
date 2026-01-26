import React from "react";
import { Pressable, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import PickerModal from "@/components/ui/pickerModal";
import { createTeamStyles as styles } from "../../../components/teams/teams-styles";
import { ContentArea } from "@/components/ui/content-area";
import { TeamLogoSection } from "@/components/teams/logo-picker";
import { TeamNameField } from "@/components/teams/name-field";
import { TeamDetailsCard } from "@/components/teams/details-card";
import { TeamVisibilitySection } from "@/components/teams/visibility";
import { createScopedLog } from "@/utils/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
import { getPickerConfig } from "@/components/teams/team-form-constants";
import PublicPaymentModal from "@/components/payments/public-payment-modal";

const log = createScopedLog("Create Team Page");

const PUBLICATION_FEE_CENTS = 1500;

export default function CreateTeamScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  const [paymentVisible, setPaymentVisible] = React.useState(false);
  const [createdTeam, setCreatedTeam] = React.useState<{
    teamId: string;
    updatePayload: any;
  } | null>(null);

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
  } = useTeamForm();

  const sportLabel = selectedSport?.label ?? "None";
  const scopeLabel = selectedScope.label;
  const cityLabel = selectedCity?.label ?? "City";

  const pickerConfig = getPickerConfig(
    setSelectedSport,
    setSelectedScope,
    setSelectedCity,
  );

  const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: teamName.trim(),
        sport: selectedSport?.id ?? "",
        scope: selectedScope?.id ?? "",
        logoUrl: logoUri ?? "",
        location: selectedCity?.label ?? "",
        privacy: "PRIVATE",
      };

      log.info("Sending team creation payload:", payload);
      const resp = await api.post(GO_TEAM_SERVICE_ROUTES.CREATE, payload);
      return resp.data as { id: string; slug: string };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });

      if (isPublic) {
        setCreatedTeam({
          teamId: data.id,
          updatePayload: { privacy: "PUBLIC" },
        });
        setPaymentVisible(true);
        return;
      }

      Alert.alert("Team created", "Your team has been created.");
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create team failed", message);
      Alert.alert("Team creation failed", message);
    },
  });

  const handleCreateTeam = () => {
    if (!teamName.trim()) {
      Alert.alert("Team creation failed", "Team name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("Team creation failed", "Sport is required");
      return;
    }
    if (!selectedCity) {
      Alert.alert("Team creation failed", "City is required");
      return;
    }

    createTeamMutation.mutate();
  };

  return (
    <ContentArea scrollable backgroundProps={{ preset: "purple" }}>
      <TeamLogoSection value={logoUri} onChange={setLogoUri} />

      <TeamNameField
        teamName={teamName}
        onChangeTeamName={(name) => {
          setTeamName(name);
        }}
      />

      <TeamDetailsCard
        sportLabel={sportLabel}
        scopeLabel={scopeLabel}
        cityLabel={cityLabel}
        onOpenPicker={(type) => {
          setOpenPicker(type);
        }}
      />

      <TeamVisibilitySection
        isPublic={isPublic}
        onChangePublic={setIsPublic}
      />

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
      <PublicPaymentModal
        visible={paymentVisible}
        onClose={() => {
          setPaymentVisible(false);
          setCreatedTeam(null);
        }}
        api={api}
        entityType="TEAM"
        entityId={createdTeam?.teamId ?? ""}
        amount={PUBLICATION_FEE_CENTS}
        onPaidSuccess={async () => {
          if (!createdTeam) return;

          await api.patch(
            `${GO_TEAM_SERVICE_ROUTES.ALL}/${createdTeam.teamId}`,
            createdTeam.updatePayload
          );

          await queryClient.invalidateQueries({ queryKey: ["teams"] });
          setCreatedTeam(null);
          setPaymentVisible(false);
          router.back();
        }}
      />
    </ContentArea>
  );
}
