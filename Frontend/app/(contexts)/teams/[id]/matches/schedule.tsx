import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useTeamDetail } from "@/hooks/use-team-detail";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { useCreateTeamMatch, useReferees } from "@/hooks/use-matches";
import { buildStartEndIso, isValidTimeRange } from "@/features/matches/utils";
import { toast } from "@/components/sign-up/utils";
import { createScopedLog } from "@/utils/logger";
import { useRefereeOptions } from "@/hooks/use-referee-options";
import { getScheduleApiErrorMessage } from "@/utils/schedule-errors";
import { MatchDetailsSection } from "@/components/matches/match-details-section";
import { useScheduleHeader } from "@/hooks/use-schedule-header";
import { AxiosError } from "axios";

const log = createScopedLog("Schedule Team Match");

type TeamSummary = {
  id: string;
  name: string;
  sport?: string | null;
};

export default function ScheduleTeamMatchScreen() {
  const params = useLocalSearchParams<{ id?: string; newVenue?: string }>();
  const teamId = params.id ?? "";
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const api = useAxiosWithClerk();

  const { team } = useTeamDetail(teamId);

  const [awayTeamId, setAwayTeamId] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState(new Date());
  const [endTimeValue, setEndTimeValue] = useState(
    new Date(Date.now() + 60 * 60 * 1000),
  );
  const [venue, setVenue] = useState("");
  const [requiresReferee, setRequiresReferee] = useState(false);
  const [refereeUserId, setRefereeUserId] = useState("");

  useEffect(() => {
    if (params.newVenue) {
      setVenue(params.newVenue);
    }
  }, [params.newVenue]);

  const teamSearch = useQuery<{ items: TeamSummary[] }>({
    queryKey: ["teams", "", false, team?.sport ?? ""],
    queryFn: async () => {
      const resp = await api.get(GO_TEAM_SERVICE_ROUTES.ALL, {
        params: { size: 80, sport: team?.sport ?? undefined },
      });
      return resp.data;
    },
    enabled: Boolean(team?.sport),
    retry: false,
  });

  const awayTeams = useMemo(
    () =>
      (teamSearch.data?.items ?? []).filter(
        (candidate) => candidate.id !== teamId,
      ),
    [teamId, teamSearch.data?.items],
  );

  const refereesQuery = useReferees({
    active: true,
    sport: team?.sport ?? undefined,
  });

  const createMutation = useCreateTeamMatch(teamId);

  const teamNameToId = useMemo(
    () =>
      Object.fromEntries(
        awayTeams.map((candidate) => [candidate.name, candidate.id]),
      ),
    [awayTeams],
  );
  const awayTeamOptions = awayTeams.map((candidate) => candidate.name);
  const { refereeOptions, refereeLabelToId, refereeIdToLabel } =
    useRefereeOptions(refereesQuery.data);

  useEffect(() => {
    if (teamSearch.error) {
      log.error("Failed to load away teams for schedule", teamSearch.error);
      Alert.alert("Load error", "Could not load teams. Please retry.");
    }
    if (refereesQuery.error) {
      log.error(
        "Failed to load referees for team schedule",
        refereesQuery.error,
      );
      Alert.alert("Load error", "Could not load referees. Please retry.");
    }
  }, [refereesQuery.error, teamSearch.error]);

  const handleSubmit = useCallback(async () => {
    if (!awayTeamId) {
      Alert.alert("Match schedule failed", "Away team is required");
      return;
    }
    if (!isValidTimeRange(date, startTimeValue, endTimeValue)) {
      Alert.alert("Match schedule failed", "End time must be after start time");
      return;
    }
    if (requiresReferee && !refereeUserId) {
      Alert.alert(
        "Match schedule failed",
        "Referee is required for official match",
      );
      return;
    }

    const { startTime, endTime } = buildStartEndIso(
      date,
      startTimeValue,
      endTimeValue,
    );

    try {
      const result = await createMutation.mutateAsync({
        homeTeamId: teamId,
        awayTeamId,
        sport: team?.sport ?? undefined,
        startTime,
        endTime,
        matchRegion: venue || undefined,
        requiresReferee,
        refereeUserId: requiresReferee ? refereeUserId : undefined,
      });

      await queryClient.invalidateQueries({
        queryKey: ["team-matches", teamId],
      });
      await queryClient.invalidateQueries({ queryKey: ["user-updates"] });
      if (requiresReferee && !result.refereeInviteSent) {
        toast("Match scheduled. Referee invite could not be sent.");
      } else {
        toast("Match scheduled");
      }
      router.replace(`/teams/${teamId}`);
    } catch (err) {
      const { status, message } = getScheduleApiErrorMessage(
        err as AxiosError<{ message?: string }>,
        "Only team owner can schedule matches",
      );
      if (status === 0) {
        Alert.alert("Network error", message, [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: handleSubmit },
        ]);
      } else {
        Alert.alert("Schedule failed", message);
      }
    }
  }, [
    awayTeamId,
    date,
    startTimeValue,
    endTimeValue,
    requiresReferee,
    refereeUserId,
    createMutation,
    teamId,
    team?.sport,
    venue,
    queryClient,
    router,
  ]);

  useScheduleHeader({
    navigation,
    onSubmit: handleSubmit,
    isPending: createMutation.isPending,
  });

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Teams">
          <Form.Menu
            label="Home Team"
            options={[team?.name ?? "My Team"]}
            value={team?.name ?? "My Team"}
            onValueChange={() => {}}
            disabled={true}
          />
          <Form.Menu
            label="Away Team"
            options={awayTeamOptions}
            value={
              awayTeams.find((candidate) => candidate.id === awayTeamId)
                ?.name ?? "Select"
            }
            onValueChange={(value) => setAwayTeamId(teamNameToId[value])}
            disabled={
              createMutation.isPending ||
              teamSearch.isLoading ||
              awayTeamOptions.length === 0
            }
          />
        </Form.Section>

        <MatchDetailsSection
          date={date}
          startTimeValue={startTimeValue}
          endTimeValue={endTimeValue}
          venue={venue}
          onDateChange={setDate}
          onStartTimeChange={setStartTimeValue}
          onEndTimeChange={setEndTimeValue}
          onVenueChange={setVenue}
          onAddVenue={() => router.push(`/teams/${teamId}/matches/add-venue`)}
        />

        <Form.Section
          header="Referee"
          footer={
            !requiresReferee
              ? "An official match requires a referee."
              : undefined
          }
        >
          <Form.Switch
            label="Official match"
            value={requiresReferee}
            onValueChange={setRequiresReferee}
          />

          {requiresReferee ? (
            <Form.Menu
              label="Choose Referee"
              options={refereeOptions}
              value={
                refereeUserId
                  ? (refereeIdToLabel[refereeUserId] ?? refereeUserId)
                  : "Select"
              }
              onValueChange={(value) =>
                setRefereeUserId(refereeLabelToId[value] ?? value)
              }
              disabled={
                createMutation.isPending ||
                refereesQuery.isLoading ||
                refereeOptions.length === 0
              }
            />
          ) : null}
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
