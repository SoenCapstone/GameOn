import { useCallback, useLayoutEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { Form } from "@/components/form/form";
import { TeamForm } from "@/components/teams/team-form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
import { settingsStyles } from "@/constants/settings-styles";
import { useUpdateTeam } from "@/hooks/use-team-league-settings";
import {
  TeamDetailProvider,
  useTeamDetailContext,
} from "@/contexts/team-detail-context";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import {
  clearLogoSelection,
  pickLogo,
  PickedLogo,
  uploadLogo,
} from "@/utils/team-league-form";

const log = createScopedLog("Edit Team");

export default function EditTeamScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <TeamDetailProvider id={id}>
      <EditTeamContent />
    </TeamDetailProvider>
  );
}

function EditTeamContent() {
  const navigation = useNavigation();
  const router = useRouter();
  const api = useAxiosWithClerk();
  const { id, team, isLoading: teamLoading, isOwner } = useTeamDetailContext();

  const [pickedLogo, setPickedLogo] = useState<PickedLogo | null>(null);

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

  const hasChanges = team
    ? teamName !== (team.name ?? "") ||
      selectedSport?.label?.toLowerCase() !== team.sport?.toLowerCase() ||
      selectedScope?.id?.toLowerCase() !== team.scope?.toLowerCase() ||
      selectedCity?.label?.toLowerCase() !== team.location?.toLowerCase() ||
      logoUri !== (team.logoUrl ?? "") ||
      pickedLogo !== null
    : false;

  const handlePickLogo = useCallback(async () => {
    await pickLogo(setPickedLogo);
  }, []);

  const handleRemoveLogo = useCallback(() => {
    clearLogoSelection(setPickedLogo, setLogoUri);
  }, [setLogoUri]);

  const handleSave = useCallback(async () => {
    if (!teamName.trim()) {
      Alert.alert("Team update failed", "Team name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("Team update failed", "Sport is required");
      return;
    }
    if (!selectedCity) {
      Alert.alert("Team update failed", "City is required");
      return;
    }

    const basePayload = {
      name: teamName.trim(),
      sport: selectedSport?.id ?? "",
      scope: selectedScope?.id ?? "",
      location: selectedCity?.label ?? "",
      privacy: (team?.privacy ?? "PRIVATE") as "PUBLIC" | "PRIVATE",
    };

    if (pickedLogo) {
      try {
        const newLogoUrl = await uploadLogo(
          api,
          GO_TEAM_SERVICE_ROUTES.TEAM_LOGO(id),
          pickedLogo,
        );
        updateTeamMutation.mutate({
          ...basePayload,
          logoUrl: newLogoUrl || (logoUri ?? ""),
        });
      } catch (err) {
        log.error("Logo upload failed", errorToString(err));
        Alert.alert("Logo upload failed", errorToString(err));
      }
    } else {
      updateTeamMutation.mutate({
        ...basePayload,
        logoUrl: logoUri ?? "",
      });
    }
  }, [
    teamName,
    selectedSport,
    selectedScope,
    selectedCity,
    logoUri,
    team?.privacy,
    pickedLogo,
    id,
    api,
    updateTeamMutation,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="Edit Team" />}
          right={
            <Button
              type="custom"
              label="Save"
              onPress={handleSave}
              loading={updateTeamMutation.isPending}
            />
          }
        />
      ),
    });
  }, [navigation, hasChanges, updateTeamMutation.isPending, handleSave]);

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

      <Form accentColor={AccentColors.red}>
        <TeamForm
          values={{
            teamName,
            selectedSport,
            selectedScope,
            selectedCity,
          }}
          logo={{ pickedLogo, logoUri }}
          onChange={{
            onTeamNameChange: setTeamName,
            onSportChange: setSelectedSport,
            onScopeChange: setSelectedScope,
            onCityChange: setSelectedCity,
            onPickLogo: handlePickLogo,
            onRemoveLogo: handleRemoveLogo,
          }}
        />
      </Form>
    </ContentArea>
  );
}
