import { useCallback, useLayoutEffect, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ContentArea } from "@/components/ui/content-area";
import { Empty } from "@/components/ui/empty";
import { Form } from "@/components/form/form";
import { LeagueForm } from "@/components/leagues/league-form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import { useLeagueForm } from "@/hooks/use-league-form";
import { useUpdateLeague } from "@/hooks/use-team-league-settings";
import {
  LeagueDetailProvider,
  useLeagueDetailContext,
} from "@/contexts/league-detail-context";
import {
  useAxiosWithClerk,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import {
  clearLogoSelection,
  pickLogo,
  PickedLogo,
  uploadLogo,
} from "@/utils/team-league-form";
import { FormToolbar } from "@/components/form/form-toolbar";
import { Loading } from "@/components/ui/loading";

const log = createScopedLog("Edit League");

export default function EditLeagueScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ?? "";

  return (
    <LeagueDetailProvider id={id}>
      <EditLeagueContent />
    </LeagueDetailProvider>
  );
}

function EditLeagueContent() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const {
    id,
    league,
    isLoading: leagueLoading,
    isOwner,
  } = useLeagueDetailContext();

  const [pickedLogo, setPickedLogo] = useState<PickedLogo | null>(null);
  const [logoUri, setLogoUri] = useState("");

  const {
    leagueName,
    setLeagueName,
    selectedSport,
    setSelectedSport,
    selectedLevel,
    setSelectedLevel,
    region,
    location,
    setLocation,
  } = useLeagueForm({ initialData: league ?? undefined });

  useLayoutEffect(() => {
    setLogoUri(league?.logoUrl ?? "");
  }, [league?.logoUrl]);

  const updateLeagueMutation = useUpdateLeague(id, {
    onSuccess: () => {
      log.info("League updated successfully");
      router.back();
    },
    onError: (err) => {
      log.error("Update league failed", errorToString(err));
      Alert.alert("Update failed", errorToString(err));
    },
  });

  const handlePickLogo = useCallback(async () => {
    await pickLogo(setPickedLogo);
  }, []);

  const handleRemoveLogo = useCallback(() => {
    clearLogoSelection(setPickedLogo, setLogoUri);
  }, []);

  const handleSave = useCallback(async () => {
    if (!leagueName.trim()) {
      Alert.alert("League update failed", "League name is required");
      return;
    }
    if (!selectedSport) {
      Alert.alert("League update failed", "Sport is required");
      return;
    }

    const basePayload = {
      name: leagueName.trim(),
      sport: selectedSport?.id ?? "",
      level: selectedLevel?.id ?? "",
      region: region.trim() || "",
      location: location.trim() || "",
      privacy: (league?.privacy ?? "PRIVATE") as "PUBLIC" | "PRIVATE",
    };

    if (pickedLogo) {
      try {
        const newLogoUrl = await uploadLogo(
          api,
          GO_LEAGUE_SERVICE_ROUTES.LEAGUE_LOGO(id),
          pickedLogo,
        );
        updateLeagueMutation.mutate({
          ...basePayload,
          logoUrl: newLogoUrl || (logoUri ?? ""),
        });
      } catch (err) {
        log.error("Logo upload failed", errorToString(err));
        Alert.alert("Logo upload failed", errorToString(err));
      }
    } else {
      updateLeagueMutation.mutate({
        ...basePayload,
        logoUrl: logoUri ?? "",
      });
    }
  }, [
    leagueName,
    selectedSport,
    selectedLevel,
    region,
    location,
    logoUri,
    league?.privacy,
    pickedLogo,
    id,
    api,
    updateLeagueMutation,
  ]);

  if (!isOwner) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <Empty message="You don't have permission to edit this league" />
      </ContentArea>
    );
  }

  if (!league) {
    return (
      <ContentArea background={{ preset: "red" }}>
        <Empty message="League not found" />
      </ContentArea>
    );
  }

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Edit League"
          onSubmit={handleSave}
          loading={updateLeagueMutation.isPending}
        />
      }
    >
      {leagueLoading && <Loading />}

      <Form accentColor={AccentColors.red}>
        <LeagueForm
          values={{
            leagueName,
            selectedSport,
            selectedLevel,
            region,
            location,
          }}
          logo={{ pickedLogo, logoUri }}
          onChange={{
            onLeagueNameChange: setLeagueName,
            onSportChange: setSelectedSport,
            onLevelChange: setSelectedLevel,
            onLocationChange: setLocation,
            onPickLogo: handlePickLogo,
            onRemoveLogo: handleRemoveLogo,
          }}
        />
      </Form>
    </ContentArea>
  );
}
