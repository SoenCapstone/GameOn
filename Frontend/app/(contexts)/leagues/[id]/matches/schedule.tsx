import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Text, View, Alert } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { matchStyles } from "@/components/matches/match-styles";
import {
  useCreateLeagueMatch,
  useLeagueTeams,
  useReferees,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { buildStartEndIso, isValidTimeRange } from "@/features/matches/utils";
import { toast } from "@/components/sign-up/utils";
import { createScopedLog } from "@/utils/logger";
import { GO_USER_SERVICE_ROUTES, useAxiosWithClerk } from "@/hooks/use-axios-clerk";

const log = createScopedLog("Schedule League Match");

function getApiErrorMessage(err: any) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message ?? "Could not schedule the match.";

  if (!err?.response) return { status: 0, message: "Network error. Please retry." };
  if (status === 403) return { status, message: "You must be league admin" };
  return { status, message };
}

export default function ScheduleLeagueMatchScreen() {
  const params = useLocalSearchParams<{ id?: string; newVenue?: string }>();
  const leagueId = params.id ?? "";
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const api = useAxiosWithClerk();

  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [refereeUserId, setRefereeUserId] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState(new Date());
  const [endTimeValue, setEndTimeValue] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [venue, setVenue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.newVenue) {
      setVenue(params.newVenue);
    }
  }, [params.newVenue]);

  const { data: leagueTeams = [] } = useLeagueTeams(leagueId);
  const teamIds = useMemo(() => leagueTeams.map((item) => item.teamId), [leagueTeams]);
  const teamsQuery = useTeamsByIds(teamIds);
  const teams = useMemo(
    () =>
      teamIds
        .map((teamId) => teamsQuery.data?.[teamId])
        .filter((team): team is NonNullable<typeof team> => Boolean(team)),
    [teamIds, teamsQuery.data],
  );

  const refereesQuery = useReferees({ active: true });
  const createMutation = useCreateLeagueMatch(leagueId);

  const teamNameToId = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.name, team.id])),
    [teams],
  );
  const teamOptions = teams.map((team) => team.name);
  const refereeIds = useMemo(
    () => (refereesQuery.data ?? []).map((ref) => ref.userId),
    [refereesQuery.data],
  );

  const refereeNamesQuery = useQuery<Record<string, string>>({
    queryKey: ["referee-name-map", refereeIds.join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        refereeIds.map(async (userId) => {
          try {
            const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(userId));
            const first = resp.data?.firstname ?? "";
            const last = resp.data?.lastname ?? "";
            const fullName = `${first} ${last}`.trim();
            return [userId, fullName || userId] as const;
          } catch {
            return [userId, userId] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: refereeIds.length > 0,
    retry: false,
  });

  const labeledReferees = useMemo(() => {
    const labels = refereeIds.map((id) => refereeNamesQuery.data?.[id] ?? id);
    const counts = labels.reduce<Record<string, number>>((acc, label) => {
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    return refereeIds.map((id, index) => {
      const baseLabel = labels[index];
      const label =
        counts[baseLabel] > 1 ? `${baseLabel} (${id.slice(0, 8)})` : baseLabel;
      return { id, label };
    });
  }, [refereeIds, refereeNamesQuery.data]);

  const refereeOptions = useMemo(
    () => labeledReferees.map((item) => item.label),
    [labeledReferees],
  );
  const refereeLabelToId = useMemo(
    () =>
      Object.fromEntries(
        labeledReferees.map((item) => [item.label, item.id]),
      ),
    [labeledReferees],
  );
  const refereeIdToLabel = useMemo(
    () =>
      Object.fromEntries(
        labeledReferees.map((item) => [item.id, item.label]),
      ),
    [labeledReferees],
  );

  useEffect(() => {
    if (teamsQuery.error) {
      log.error("Failed to load league teams for schedule", teamsQuery.error);
    }
    if (refereesQuery.error) {
      log.error("Failed to load referees for schedule", refereesQuery.error);
    }
  }, [refereesQuery.error, teamsQuery.error]);

  const validate = useCallback(() => {
    const nextErrors: Record<string, string> = {};

    if (!homeTeamId) nextErrors.homeTeamId = "Home team is required";
    if (!awayTeamId) nextErrors.awayTeamId = "Away team is required";
    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      nextErrors.awayTeamId = "Home and away teams must be different";
    }
    if (!date) nextErrors.date = "Date is required";
    if (!startTimeValue) nextErrors.startTime = "Start time is required";
    if (!endTimeValue) nextErrors.endTime = "End time is required";
    if (!isValidTimeRange(date, startTimeValue, endTimeValue)) {
      nextErrors.timeRange = "End time must be after start time";
    }
    if (!refereeUserId) nextErrors.refereeUserId = "Referee is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    awayTeamId,
    date,
    endTimeValue,
    homeTeamId,
    refereeUserId,
    startTimeValue,
  ]);

  const isValid =
    homeTeamId.length > 0 &&
    awayTeamId.length > 0 &&
    homeTeamId !== awayTeamId &&
    isValidTimeRange(date, startTimeValue, endTimeValue) &&
    refereeUserId.length > 0;

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const { startTime, endTime } = buildStartEndIso(
      date,
      startTimeValue,
      endTimeValue,
    );

    try {
      await createMutation.mutateAsync({
        homeTeamId,
        awayTeamId,
        startTime,
        endTime,
        matchLocation: venue || undefined,
        refereeUserId,
      });

      await queryClient.invalidateQueries({ queryKey: ["league-matches", leagueId] });
      toast("Match scheduled");
      router.replace(`/leagues/${leagueId}`);
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
    homeTeamId,
    leagueId,
    queryClient,
    refereeUserId,
    router,
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
          <View>
            <Form.Menu
              label="Home Team"
              options={teamOptions}
              value={teams.find((team) => team.id === homeTeamId)?.name ?? "Select"}
              onValueChange={(value) => setHomeTeamId(teamNameToId[value])}
              disabled={
                createMutation.isPending || teamsQuery.isLoading || teamOptions.length === 0
              }
            />
            {errors.homeTeamId ? <Text style={matchStyles.errorInline}>{errors.homeTeamId}</Text> : null}
            {teamsQuery.error ? (
              <Text style={matchStyles.errorInline}>Could not load teams. Pull to retry.</Text>
            ) : null}
          </View>

          <View>
            <Form.Menu
              label="Away Team"
              options={teamOptions}
              value={teams.find((team) => team.id === awayTeamId)?.name ?? "Select"}
              onValueChange={(value) => setAwayTeamId(teamNameToId[value])}
              disabled={
                createMutation.isPending || teamsQuery.isLoading || teamOptions.length === 0
              }
            />
            {errors.awayTeamId ? <Text style={matchStyles.errorInline}>{errors.awayTeamId}</Text> : null}
          </View>
        </Form.Section>

        <Form.Section header="Match Details">
          <View>
            <Form.DateTime
              label="Date"
              value={date}
              mode="date"
              display="default"
              onChange={(_event, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
            />
            {errors.date ? <Text style={matchStyles.errorInline}>{errors.date}</Text> : null}
          </View>

          <View>
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
          </View>

          <View>
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
          </View>

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
                pathname: "/leagues/[id]/matches/add-venue",
                params: { id: leagueId },
              })
            }
          />
        </Form.Section>

        <Form.Section header="Referee">
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
        </Form.Section>

        {errors.form ? <Text style={matchStyles.errorInline}>{errors.form}</Text> : null}
      </Form>
    </ContentArea>
  );
}
