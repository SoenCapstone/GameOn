import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { toast } from "@/utils/toast";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { LeagueForm } from "@/components/leagues/league-form";
import { AccentColors } from "@/constants/colors";
import { createScopedLog } from "@/utils/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorToString } from "@/utils/error";
import { useLeagueForm } from "@/hooks/use-league-form";
import { pickLogo, PickedLogo, uploadLogo } from "@/utils/team-league-form";
import {
  useAxiosWithClerk,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { FormToolbar } from "@/components/form/form-toolbar";

const log = createScopedLog("Create League Page");

export default function CreateLeagueScreen() {
  const router = useRouter();
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();

  const [pickedLogo, setPickedLogo] = useState<PickedLogo | null>(null);

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
  } = useLeagueForm({ initialData: { region: "Canada" } });

  const handlePickLogo = useCallback(async () => {
    await pickLogo(setPickedLogo);
  }, []);

  const createLeagueMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: leagueName.trim(),
        sport: selectedSport?.id ?? "",
        region: region.trim() || undefined,
        location: location.trim() || undefined,
        level: selectedLevel?.id ?? undefined,
        privacy: "PRIVATE" as const,
      };

      log.info("Sending league creation payload:", payload);
      const resp = await api.post(GO_LEAGUE_SERVICE_ROUTES.CREATE, payload);
      const data = resp.data as { id: string; slug: string };

      if (pickedLogo && data.id) {
        await uploadLogo(
          api,
          GO_LEAGUE_SERVICE_ROUTES.LEAGUE_LOGO(data.id),
          pickedLogo,
        );
        log.info("League logo uploaded for league", data.id);
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
      toast.success("League Created", {
        description: "Your league has been created successfully.",
      });
      router.back();
    },
    onError: (err) => {
      const message = errorToString(err);
      log.error("Create league failed", message);
      toast.error("League Creation Failed", {
        description: message,
      });
    },
  });

  const handleCreateLeague = useCallback(() => {
    if (!leagueName.trim() || !selectedSport) {
      toast.error("League Creation Failed", {
        description: "Fill all required fields",
      });
      return;
    }
    createLeagueMutation.mutate();
  }, [leagueName, selectedSport, createLeagueMutation]);

  return (
    <ContentArea
      background={{ preset: "purple", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Create a League"
          label="Create"
          onSubmit={handleCreateLeague}
          loading={createLeagueMutation.isPending}
        />
      }
    >
      <Form accentColor={AccentColors.purple}>
        <LeagueForm
          values={{
            leagueName,
            selectedSport,
            selectedLevel,
            region,
            location,
          }}
          logo={{ pickedLogo }}
          onChange={{
            onLeagueNameChange: setLeagueName,
            onSportChange: setSelectedSport,
            onLevelChange: setSelectedLevel,
            onLocationChange: setLocation,
            onPickLogo: handlePickLogo,
            onRemoveLogo: () => setPickedLogo(null),
          }}
        />
      </Form>
    </ContentArea>
  );
}
