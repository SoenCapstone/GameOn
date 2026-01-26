import React, { useLayoutEffect } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  Text,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation, StackActions } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { TeamLogoSection } from "@/components/teams/logo-picker";
import { TeamNameField } from "@/components/teams/name-field";
import { TeamDetailsCard } from "@/components/teams/details-card";
import { TeamVisibilitySection } from "@/components/teams/visibility";
import PickerModal from "@/components/ui/pickerModal";
import { useUpdateTeam, useDeleteTeam } from "@/hooks/use-team-league-settings";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
import { getPickerConfig } from "@/components/teams/team-form-constants";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import { settingsStyles } from "@/constants/settings-styles";
import PublicPaymentModal from "@/components/payments/public-payment-modal";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";

//DO NOT delete any of the commented lines and unused variables here they are for team payments just waiting for back end implementation

const log = createScopedLog("Team Settings");
const PUBLICATION_FEE_CENTS = 1500;

function SettingsHeader({
  onSave,
  isSaveEnabled,
  isSaving,
}: {
  readonly onSave: () => void;
  readonly isSaveEnabled: boolean;
  readonly isSaving: boolean;
}) {
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

  return (
    <TeamDetailProvider id={id}>
      <TeamSettingsContent />
    </TeamDetailProvider>
  );
}

function TeamSettingsContent() {
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const { id, team, isLoading: teamLoading, isOwner } = useTeamDetailContext();

  const [paymentVisible, setPaymentVisible] = React.useState(false);
  const [pendingPayload, setPendingPayload] = React.useState<any | null>(null);

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

  const updateTeamMutation = useUpdateTeam(id, {
    onSuccess: () => {
      log.info("Team updated successfully");
      router.back();
    },
    onError: (err) => {
      log.error("Update team failed", errorToString(err));
      Alert.alert("Update failed", errorToString(err));
    },
  });

  const deleteTeamMutation = useDeleteTeam(id, {
    onSuccess: () => {
      log.info("Team deleted successfully");
      navigation.dispatch(StackActions.pop(2));
      router.back();
    },
    onError: (err) => {
      log.error("Delete team failed", errorToString(err));
      Alert.alert("Delete failed", errorToString(err));
    },
  });

  const handleDeleteTeam = () => {
    Alert.alert(
      "Delete Team",
      "Are you sure you want to delete this team? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteTeamMutation.mutate(),
          style: "destructive",
        },
      ],
    );
  };

  const sportLabel = selectedSport?.label ?? "None";
  const scopeLabel = selectedScope.label;
  const cityLabel = selectedCity?.label ?? "City";

  const hasChanges = team
    ? teamName !== (team.name ?? "") ||
      selectedSport?.label?.toLowerCase() !== team.sport?.toLowerCase() ||
      selectedScope?.id?.toLowerCase() !== team.scope?.toLowerCase() ||
      selectedCity?.label?.toLowerCase() !== team.location?.toLowerCase() ||
      logoUri !== (team.logoUrl ?? "") ||
      isPublic !== (team.privacy === "PUBLIC")
    : false;

  const pickerConfig = getPickerConfig(
    setSelectedSport,
    setSelectedScope,
    setSelectedCity,
  );

  const currentConfig = openPicker ? pickerConfig[openPicker] : undefined;

  useLayoutEffect(() => {
    const renderHeader = () => {
      const handleUpdateTeam = () => {
        if (!teamName.trim()) {
          Alert.alert("Team update failed", "Team name is required");
          return;
        }

        const payload = {
          name: teamName.trim(),
          sport: selectedSport?.id ?? "",
          scope: selectedScope?.id ?? "",
          logoUrl: logoUri ?? "",
          location: selectedCity?.label ?? "",
          privacy: isPublic ? "PUBLIC" : "PRIVATE",
        } as const;

        // Payment disabled until back end implementation
        // ===============================
        // const wasPublic = (team?.privacy ?? "PRIVATE") === "PUBLIC";
        // const wantsPublic = payload.privacy === "PUBLIC";
        //
        // if (!wasPublic && wantsPublic) {
        //   setPendingPayload(payload);
        //   setPaymentVisible(true);
        //   return;
        // }

        updateTeamMutation.mutate(payload);
      };

      return (
        <SettingsHeader
          onSave={handleUpdateTeam}
          isSaveEnabled={hasChanges}
          isSaving={updateTeamMutation.isPending}
        />
      );
    };

    navigation.setOptions({
      headerTitle: renderHeader,
    });
  }, [
    navigation,
    hasChanges,
    updateTeamMutation.isPending,
    updateTeamMutation,
    team,
    teamName,
    selectedSport,
    selectedCity,
    isPublic,
    logoUri,
    selectedScope,
  ]);

  if (!isOwner) {
    return (
      <ContentArea backgroundProps={{ preset: "red" }}>
        <View style={settingsStyles.container}>
          <Text style={settingsStyles.errorText}>
            You don&apos;t have permission to edit this team
          </Text>
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
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      {teamLoading && (
        <View style={settingsStyles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

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
        style={[
          settingsStyles.deleteButton,
          deleteTeamMutation.isPending && settingsStyles.deleteButtonDisabled,
        ]}
        onPress={handleDeleteTeam}
        disabled={deleteTeamMutation.isPending}
      >
        <Text style={settingsStyles.deleteButtonText}>
          {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
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

      {/* Payment disabled until backend implementation */}
      {/*
      <PublicPaymentModal
        visible={paymentVisible}
        onClose={() => {
          setPaymentVisible(false);
          setPendingPayload(null);
        }}
        api={api}
        entityType="TEAM"
        entityId={id}
        amount={PUBLICATION_FEE_CENTS}
        onPaidSuccess={async () => {
          if (!pendingPayload) return;
          updateTeamMutation.mutate(pendingPayload);
          setPendingPayload(null);
          setPaymentVisible(false);
        }}
      />
      */}
    </ContentArea>
  );
}
