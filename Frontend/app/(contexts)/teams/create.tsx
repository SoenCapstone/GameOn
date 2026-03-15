import { useCallback, useLayoutEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { ContentArea } from "@/components/ui/content-area";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form/form";
import { TeamForm } from "@/components/teams/team-form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
import { pickLogo, PickedLogo, uploadLogo } from "@/utils/team-league-form";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

const log = createScopedLog("Create Team Page");

const CreateTeamHeader = ({
  onCreate,
  isCreating,
}: {
  onCreate: () => void;
  isCreating: boolean;
}) => (
  <Header
    left={<Button type="back" />}
    center={<PageTitle title="Create a Team" />}
    right={
      <Button
        type="custom"
        label={isCreating ? "Creating..." : "Create"}
        onPress={onCreate}
        loading={isCreating}
      />
    }
  />
);

export default function CreateTeamScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

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
    selectedAllowedRegions,
    setSelectedAllowedRegions,
  } = useTeamForm();
  const [allowedRegionsError, setAllowedRegionsError] = useState("");

  const handlePickLogo = useCallback(async () => {
    await pickLogo(setPickedLogo);
  }, []);

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: teamName.trim(),
        sport: selectedSport?.id ?? "",
        scope: selectedScope?.id ?? "",
        location: selectedCity?.label ?? "",
        allowedRegions: selectedAllowedRegions,
        privacy: "PRIVATE",
      };
      log.info("Sending team creation payload:", payload);
      const resp = await api.post(GO_TEAM_SERVICE_ROUTES.CREATE, payload);
      const data = resp.data as { id: string; slug: string };

      if (pickedLogo && data.id) {
        await uploadLogo(
          api,
          GO_TEAM_SERVICE_ROUTES.TEAM_LOGO(data.id),
          pickedLogo,
        );
        log.info("Team logo uploaded for team", data.id);
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      Alert.alert("Team created", "Your team has been created.");
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create team failed", message);
      Alert.alert("Team creation failed", message);
    },
  });

  const handleCreateTeam = useCallback(() => {
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
    if (selectedAllowedRegions.length === 0) {
      setAllowedRegionsError("Please select at least one region.");
      return;
    }
    createTeamMutation.mutate();
  }, [
    createTeamMutation,
    selectedAllowedRegions.length,
    selectedCity,
    selectedSport,
    teamName,
  ]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <CreateTeamHeader
          onCreate={handleCreateTeam}
          isCreating={createTeamMutation.isPending}
        />
      ),
    });
  }, [navigation, createTeamMutation.isPending, handleCreateTeam]);

  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "purple", mode: "form" }}
    >
      <Form accentColor={AccentColors.purple}>
        <TeamForm
          values={{
            teamName,
            selectedSport,
            selectedScope,
            selectedCity,
            selectedAllowedRegions,
          }}
          logo={{ pickedLogo }}
          allowedRegionsError={allowedRegionsError}
          onChange={{
            onTeamNameChange: setTeamName,
            onSportChange: setSelectedSport,
            onScopeChange: setSelectedScope,
            onCityChange: (city) => {
              setSelectedCity(city);
              if (allowedRegionsError) {
                setAllowedRegionsError("");
              }
            },
            onAllowedRegionsChange: (regions) => {
              setSelectedAllowedRegions(regions);
              setAllowedRegionsError(
                regions.length === 0 ? "Please select at least one region." : "",
              );
            },
            onPickLogo: handlePickLogo,
            onRemoveLogo: () => setPickedLogo(null),
          }}
        />
      </Form>
    </ContentArea>
  );
}
