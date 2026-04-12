import { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { Form } from "@/components/form/form";
import { TeamForm } from "@/components/teams/team-form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { useTeamForm } from "@/hooks/use-team-form";
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
import { FormToolbar } from "@/components/form/form-toolbar";
import { Loading } from "@/components/ui/loading";

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
    selectedAllowedRegions,
    setSelectedAllowedRegions,
    logoUri,
    setLogoUri,
  } = useTeamForm({
    initialData: team,
  });
  const [allowedRegionsError, setAllowedRegionsError] = useState("");

  const updateTeamMutation = useUpdateTeam(id, {
    onSuccess: () => {
      log.info("Team updated successfully");
      router.back();
    },
    onError: (err) => {
      log.error("Update team failed", errorToString(err));
      toast.error("Update Failed", {
        description: errorToString(err),
      });
    },
  });

  const handlePickLogo = useCallback(async () => {
    await pickLogo(setPickedLogo);
  }, []);

  const handleRemoveLogo = useCallback(() => {
    clearLogoSelection(setPickedLogo, setLogoUri);
  }, [setLogoUri]);

  const handleSave = useCallback(async () => {
    if (!teamName.trim() || !selectedSport || !selectedCity) {
      toast.error("Update Failed", {
        description: "Fill all required fields",
      });
      return;
    }
    if (selectedAllowedRegions.length === 0) {
      setAllowedRegionsError("Please select at least one region.");
      return;
    }

    const basePayload = {
      name: teamName.trim(),
      sport: selectedSport?.id ?? "",
      scope: selectedScope?.id ?? "",
      location: selectedCity?.label ?? "",
      allowedRegions: selectedAllowedRegions,
      privacy: team?.privacy ?? "PRIVATE",
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
        toast.error("Logo Upload Failed", {
          description: errorToString(err),
        });
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
    selectedAllowedRegions,
    logoUri,
    team?.privacy,
    pickedLogo,
    id,
    api,
    updateTeamMutation,
  ]);

  if (!isOwner) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <Empty message="You don't have permission to edit this team" />
      </ContentArea>
    );
  }

  if (!team) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <Empty message="Team not found" />
      </ContentArea>
    );
  }

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Edit team"
          onSubmit={handleSave}
          loading={updateTeamMutation.isPending}
        />
      }
    >
      {teamLoading && <Loading />}

      <Form accentColor={AccentColors.red}>
        <TeamForm
          values={{
            teamName,
            selectedSport,
            selectedScope,
            selectedCity,
            selectedAllowedRegions,
          }}
          logo={{ pickedLogo, logoUri }}
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
            onRemoveLogo: handleRemoveLogo,
          }}
        />
      </Form>
    </ContentArea>
  );
}
