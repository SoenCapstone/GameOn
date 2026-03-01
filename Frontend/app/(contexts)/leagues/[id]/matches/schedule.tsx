import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Alert } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import {
  useCreateLeagueMatch,
  useLeagueTeams,
  useReferees,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { buildStartEndIso, isValidTimeRange } from "@/features/matches/utils";
import { toast } from "@/components/sign-up/utils";
import { createScopedLog } from "@/utils/logger";
import { useRefereeOptions } from "@/hooks/use-referee-options";
import {
  getScheduleApiErrorMessage,
  MatchDetailsSection,
  useScheduleHeader,
} from "@/components/matches/schedule-shared";
import { AxiosError } from "axios";

const log = createScopedLog("Schedule League Match");

export default function ScheduleLeagueMatchScreen() {
  const params = useLocalSearchParams<{ id?: string; newVenue?: string }>();
  const leagueId = params.id ?? "";
  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [refereeUserId, setRefereeUserId] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState(new Date());
  const [endTimeValue, setEndTimeValue] = useState(
    new Date(Date.now() + 60 * 60 * 1000),
  );
  const [venue, setVenue] = useState("");

  useEffect(() => {
    if (params.newVenue) {
      setVenue(params.newVenue);
    }
  }, [params.newVenue]);

  const { league } = useLeagueDetail(leagueId);
  const { data: leagueTeams = [] } = useLeagueTeams(leagueId);
  const teamIds = useMemo(
    () => leagueTeams.map((item) => item.teamId),
    [leagueTeams],
  );
  const teamsQuery = useTeamsByIds(teamIds);
  const teams = useMemo(
    () =>
      teamIds
        .map((teamId) => teamsQuery.data?.[teamId])
        .filter((team): team is NonNullable<typeof team> => Boolean(team)),
    [teamIds, teamsQuery.data],
  );

  const refereesQuery = useReferees({
    active: true,
    sport: league?.sport ?? undefined,
  });
  const createMutation = useCreateLeagueMatch(leagueId);

  const teamNameToId = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.name, team.id])),
    [teams],
  );
  const teamOptions = teams.map((team) => team.name);
  const homeTeamOptions = useMemo(() => {
    if (!awayTeamId) return teamOptions;
    return teams
      .filter((team) => team.id !== awayTeamId || team.id === homeTeamId)
      .map((team) => team.name);
  }, [awayTeamId, homeTeamId, teamOptions, teams]);
  const awayTeamOptions = useMemo(() => {
    if (!homeTeamId) return teamOptions;
    return teams
      .filter((team) => team.id !== homeTeamId || team.id === awayTeamId)
      .map((team) => team.name);
  }, [awayTeamId, homeTeamId, teamOptions, teams]);
  const { refereeOptions, refereeLabelToId, refereeIdToLabel } =
    useRefereeOptions(refereesQuery.data);

  useEffect(() => {
    if (teamsQuery.error) {
      log.error("Failed to load league teams for schedule", teamsQuery.error);
      Alert.alert("Load error", "Could not load teams. Please retry.");
    }
    if (refereesQuery.error) {
      log.error("Failed to load referees for schedule", refereesQuery.error);
      Alert.alert("Load error", "Could not load referees. Please retry.");
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

    if (Object.keys(nextErrors).length > 0) {
      const firstError = Object.values(nextErrors)[0];
      if (firstError) {
        Alert.alert("Invalid match details", firstError);
      }
    }
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

      await queryClient.invalidateQueries({
        queryKey: ["league-matches", leagueId],
      });
      toast("Match scheduled");
      router.replace(`/leagues/${leagueId}`);
    } catch (err) {
      const { status, message } = getScheduleApiErrorMessage(
        err as AxiosError<{ message?: string }>,
        "You must be league admin",
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

  useScheduleHeader({
    navigation,
    onSubmit: handleSubmit,
    isPending: createMutation.isPending,
    isValid,
  });

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Teams">
          <View>
            <Form.Menu
              label="Home Team"
              options={homeTeamOptions}
              value={
                teams.find((team) => team.id === homeTeamId)?.name ?? "Select"
              }
              onValueChange={(value) => setHomeTeamId(teamNameToId[value])}
              disabled={
                createMutation.isPending ||
                teamsQuery.isLoading ||
                teamOptions.length === 0
              }
            />
          </View>

          <View>
            <Form.Menu
              label="Away Team"
              options={awayTeamOptions}
              value={
                teams.find((team) => team.id === awayTeamId)?.name ?? "Select"
              }
              onValueChange={(value) => setAwayTeamId(teamNameToId[value])}
              disabled={
                createMutation.isPending ||
                teamsQuery.isLoading ||
                teamOptions.length === 0
              }
            />
          </View>
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
          onAddVenue={() =>
            router.push(`/leagues/${leagueId}/matches/add-venue`)
          }
        />

        <Form.Section header="Referee">
          <View>
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
          </View>
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
