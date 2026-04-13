import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
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
import { FormToolbar } from "@/components/form/form-toolbar";
import { usePostHog } from "posthog-react-native";

const log = createScopedLog("Create Team Page");

export default function CreateTeamScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

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
    onSuccess: async (data) => {
      posthog.capture("team_created", {
        sport: selectedSport?.id,
        scope: selectedScope?.id,
        location: selectedCity?.label,
        has_logo: Boolean(pickedLogo),
        team_id: data.id,
      });
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team Created", {
        description: "Your team has been created.",
      });
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create team failed", message);
      toast.error("Team Creation Failed", {
        description: message,
      });
    },
  });

  const handleCreateTeam = useCallback(() => {
    if (!teamName.trim() || !selectedSport || !selectedCity) {
      toast.error("Team Creation Failed", {
        description: "Fill all required fields",
      });
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

  return (
    <ContentArea
      background={{ preset: "purple", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Create a Team"
          label="Create"
          onSubmit={handleCreateTeam}
          loading={createTeamMutation.isPending}
        />
      }
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
                regions.length === 0
                  ? "Please select at least one region."
                  : "",
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
