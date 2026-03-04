import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
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
import { getScheduleApiErrorMessage } from "@/utils/schedule-errors";
import { MatchDetailsSection } from "@/components/matches/match-details-section";
import { useScheduleHeader } from "@/hooks/use-schedule-header";
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

  const handleSubmit = useCallback(async () => {
    if (!homeTeamId) {
      Alert.alert("Match schedule failed", "Home team is required");
      return;
    }
    if (!awayTeamId) {
      Alert.alert("Match schedule failed", "Away team is required");
      return;
    }
    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      Alert.alert(
        "Match schedule failed",
        "Home and away teams must be different",
      );
    }
    if (!date) {
      Alert.alert("Match schedule failed", "Date is required");
      return;
    }
    if (!startTimeValue) {
      Alert.alert("Match schedule failed", "Start time is required");
      return;
    }
    if (!endTimeValue) {
      Alert.alert("Match schedule failed", "End time is required");
      return;
    }
    if (!isValidTimeRange(date, startTimeValue, endTimeValue)) {
      Alert.alert("Match schedule failed", "End time must be after start time");
      return;
    }
    if (!refereeUserId) {
      Alert.alert("Match schedule failed", "Referee is required");
      return;
    }

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
      router.back();
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
    venue,
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
            options={homeTeamOptions}
            value={
              teams.find((team) => team.id === homeTeamId)?.name ?? "Select"
            }
            onValueChange={(value) => setHomeTeamId(teamNameToId[value])}
            disabled={
              createMutation.isPending ||
              teamsQuery.isLoading ||
              homeTeamOptions.length === 0
            }
          />

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
          onAddVenue={() =>
            router.push(`/leagues/${leagueId}/matches/add-venue`)
          }
        />

        <Form.Section header="Referee">
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
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
