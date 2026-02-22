import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { matchStyles } from "@/components/matches/match-styles";
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

const log = createScopedLog("Schedule Team Match");

type TeamSummary = {
  id: string;
  name: string;
  sport?: string | null;
};

function getApiErrorMessage(err: any) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message ?? "Could not schedule the match.";

  if (!err?.response) return { status: 0, message: "Network error. Please retry." };
  if (status === 403) return { status, message: "Only team owner can schedule matches" };
  return { status, message };
}

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
  const [endTimeValue, setEndTimeValue] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [venue, setVenue] = useState("");
  const [requiresReferee, setRequiresReferee] = useState(false);
  const [refereeUserId, setRefereeUserId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    () => (teamSearch.data?.items ?? []).filter((candidate) => candidate.id !== teamId),
    [teamId, teamSearch.data?.items],
  );

  const refereesQuery = useReferees({ active: true, sport: team?.sport ?? undefined });

  const createMutation = useCreateTeamMatch(teamId);

  const teamNameToId = useMemo(
    () => Object.fromEntries(awayTeams.map((candidate) => [candidate.name, candidate.id])),
    [awayTeams],
  );
  const awayTeamOptions = awayTeams.map((candidate) => candidate.name);
  const { refereeOptions, refereeLabelToId, refereeIdToLabel } = useRefereeOptions(
    refereesQuery.data,
  );

  useEffect(() => {
    if (teamSearch.error) {
      log.error("Failed to load away teams for schedule", teamSearch.error);
    }
    if (refereesQuery.error) {
      log.error("Failed to load referees for team schedule", refereesQuery.error);
    }
  }, [refereesQuery.error, teamSearch.error]);

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!awayTeamId) nextErrors.awayTeamId = "Away team is required";
    if (!startTimeValue) nextErrors.startTime = "Start time is required";
    if (!endTimeValue) nextErrors.endTime = "End time is required";
    if (!isValidTimeRange(date, startTimeValue, endTimeValue)) {
      nextErrors.timeRange = "End time must be after start time";
    }
    if (requiresReferee && !refereeUserId) {
      nextErrors.refereeUserId = "Referee is required for official match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    awayTeamId,
    date,
    endTimeValue,
    refereeUserId,
    requiresReferee,
    startTimeValue,
  ]);

  const isValid =
    Boolean(awayTeamId) &&
    isValidTimeRange(date, startTimeValue, endTimeValue) &&
    (!requiresReferee || Boolean(refereeUserId));

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

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

      await queryClient.invalidateQueries({ queryKey: ["team-matches", teamId] });
      await queryClient.invalidateQueries({ queryKey: ["user-updates"] });
      if (requiresReferee && !result.refereeInviteSent) {
        toast("Match scheduled. Referee invite could not be sent.");
      } else {
        toast("Match scheduled");
      }
      router.replace(`/teams/${teamId}`);
    } catch (err: any) {
      const { status, message } = getApiErrorMessage(err);
      setErrors((prev) => ({ ...prev, form: message }));
      toast(message);
      if (status === 0) {
        Alert.alert("Network error", message, [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: handleSubmit },
        ]);
      }
    }
  }, [
    awayTeamId,
    createMutation,
    date,
    queryClient,
    refereeUserId,
    requiresReferee,
    router,
    team?.sport,
    teamId,
    startTimeValue,
    endTimeValue,
    validate,
    venue,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Header
          left={<Button type="back" />}
          center={<PageTitle title="Schedule a Match" />}
          right={
            <Button
              type="custom"
              label="Schedule"
              onPress={handleSubmit}
              loading={createMutation.isPending}
              isInteractive={!createMutation.isPending && isValid}
            />
          }
        />
      ),
    });
  }, [createMutation.isPending, handleSubmit, isValid, navigation]);

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Teams">
          <Form.Input label="Home Team" value={team?.name ?? "My Team"} editable={false} />
          <View>
            <Form.Menu
              label="Away Team"
              options={awayTeamOptions}
              value={awayTeams.find((candidate) => candidate.id === awayTeamId)?.name ?? "Select"}
              onValueChange={(value) => setAwayTeamId(teamNameToId[value])}
              disabled={
                createMutation.isPending ||
                teamSearch.isLoading ||
                awayTeamOptions.length === 0
              }
            />
            {errors.awayTeamId ? <Text style={matchStyles.errorInline}>{errors.awayTeamId}</Text> : null}
            {teamSearch.error ? (
              <Text style={matchStyles.errorInline}>
                Could not load teams. Pull to retry.
              </Text>
            ) : null}
          </View>
        </Form.Section>

        <Form.Section header="Match Details">
          <Form.DateTime
            label="Date"
            value={date}
            mode="date"
            display="default"
            onChange={(_event, selectedDate) => {
              if (selectedDate) setDate(selectedDate);
            }}
          />
          <Form.DateTime
            label="Start Time"
            value={startTimeValue}
            mode="time"
            display="default"
            onChange={(_event, selectedDate) => {
              if (selectedDate) setStartTimeValue(selectedDate);
            }}
          />
          {errors.startTime ? (
            <Text style={matchStyles.errorInline}>{errors.startTime}</Text>
          ) : null}
          <Form.DateTime
            label="End Time"
            value={endTimeValue}
            mode="time"
            display="default"
            onChange={(_event, selectedDate) => {
              if (selectedDate) setEndTimeValue(selectedDate);
            }}
          />
          {errors.endTime ? (
            <Text style={matchStyles.errorInline}>{errors.endTime}</Text>
          ) : null}
          {errors.timeRange ? (
            <Text style={matchStyles.errorInline}>{errors.timeRange}</Text>
          ) : null}
          <Form.Input
            label="Venue"
            placeholder="Optional"
            value={venue}
            onChangeText={setVenue}
          />
          <Form.Link
            label="Add Venue"
            onPress={() =>
              router.push({
                pathname: "/teams/[id]/matches/add-venue",
                params: { id: teamId },
              })
            }
          />
        </Form.Section>

        <Form.Section header="Referee">
          <Form.Switch
            label="Official match (requires referee)"
            value={requiresReferee}
            onValueChange={setRequiresReferee}
          />

          {requiresReferee ? (
            <View>
              <Form.Menu
                label="Choose Referee"
                options={refereeOptions}
                value={refereeUserId ? refereeIdToLabel[refereeUserId] ?? refereeUserId : "Select"}
                onValueChange={(value) => setRefereeUserId(refereeLabelToId[value] ?? value)}
                disabled={
                  createMutation.isPending ||
                  refereesQuery.isLoading ||
                  refereeOptions.length === 0
                }
              />
              {errors.refereeUserId ? (
                <Text style={matchStyles.errorInline}>{errors.refereeUserId}</Text>
              ) : null}
              {refereesQuery.error ? (
                <Text style={matchStyles.errorInline}>
                  Could not load referees. Pull to retry.
                </Text>
              ) : null}
            </View>
          ) : null}
        </Form.Section>

        {errors.form ? <Text style={matchStyles.errorInline}>{errors.form}</Text> : null}
      </Form>
    </ContentArea>
  );
}
