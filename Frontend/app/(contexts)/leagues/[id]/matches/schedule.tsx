import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import {
  buildVenueOptionMaps,
  buildVenueOptions,
  resolveSelectedVenueLabel,
} from "@/features/matches/schedule-shared";
import {
  useCreateLeagueMatch,
  useLeagueTeams,
  useLeagueVenues,
  useReferees,
  useTeamsByIds,
} from "@/hooks/use-matches";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { toast } from "@/components/sign-up/utils";
import {
  buildStartEndIso,
  isValidTimeRange,
  parseDraftDate,
} from "@/utils/date";
import { createScopedLog } from "@/utils/logger";
import { showScheduleSubmitError } from "@/utils/schedule-errors";
import { useRefereeOptions } from "@/hooks/use-referee-options";
import { MatchDetailsSection } from "@/components/matches/match-details-section";
import { useScheduleHeader } from "@/hooks/use-schedule-header";

const log = createScopedLog("Schedule League Match");

export default function ScheduleLeagueMatchScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    newVenueId?: string;
    newVenueName?: string;
    draftHomeTeamId?: string;
    draftAwayTeamId?: string;
    draftDate?: string;
    draftStartTime?: string;
    draftEndTime?: string;
    draftVenueId?: string;
    draftRefereeUserId?: string;
  }>();
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
  const [venueId, setVenueId] = useState("");

  useEffect(() => {
    if (params.newVenueId) {
      setVenueId(params.newVenueId);
    }
  }, [params.newVenueId]);

  useEffect(() => {
    if (params.draftHomeTeamId) {
      setHomeTeamId(params.draftHomeTeamId);
    }
    if (params.draftAwayTeamId) {
      setAwayTeamId(params.draftAwayTeamId);
    }
    const draftDate = parseDraftDate(params.draftDate);
    if (draftDate) setDate(draftDate);
    const draftStart = parseDraftDate(params.draftStartTime);
    if (draftStart) setStartTimeValue(draftStart);
    const draftEnd = parseDraftDate(params.draftEndTime);
    if (draftEnd) setEndTimeValue(draftEnd);
    if (params.draftVenueId && !params.newVenueId) {
      setVenueId(params.draftVenueId);
    }
    if (params.draftRefereeUserId) {
      setRefereeUserId(params.draftRefereeUserId);
    }
  }, [
    params.draftAwayTeamId,
    params.draftDate,
    params.draftEndTime,
    params.draftHomeTeamId,
    params.draftRefereeUserId,
    params.draftStartTime,
    params.draftVenueId,
    params.newVenueId,
  ]);

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

  const venuesQuery = useLeagueVenues({
    homeTeamId: homeTeamId || undefined,
    awayTeamId: awayTeamId || undefined,
    enabled: Boolean(leagueId),
  });
  const refetchVenues = venuesQuery.refetch;

  const venueOptions = useMemo(
    () => buildVenueOptions(venuesQuery.data),
    [venuesQuery.data],
  );
  const { venueLabelToId, venueIdToLabel } = useMemo(
    () => buildVenueOptionMaps(venueOptions),
    [venueOptions],
  );
  const selectedVenueLabel = resolveSelectedVenueLabel(
    venueId,
    venueIdToLabel,
    params.newVenueName,
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
    if (venuesQuery.error) {
      log.error("Failed to load league venues for schedule", venuesQuery.error);
      Alert.alert("Load error", "Could not load venues. Please retry.");
    }
    if (refereesQuery.error) {
      log.error("Failed to load referees for schedule", refereesQuery.error);
      Alert.alert("Load error", "Could not load referees. Please retry.");
    }
  }, [refereesQuery.error, teamsQuery.error, venuesQuery.error]);

  useEffect(() => {
    if (params.newVenueId) {
      refetchVenues().catch((err) => {
        log.error("Failed to refresh venues after venue creation", err);
      });
    }
  }, [params.newVenueId, refetchVenues]);

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
    if (!venueId) {
      Alert.alert("Match schedule failed", "Venue is required");
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
        venueId,
        refereeUserId,
      });

      await queryClient.invalidateQueries({
        queryKey: ["league-matches", leagueId],
      });
      toast("Match scheduled");
      router.dismissTo({
        pathname: `/leagues/${leagueId}` as RelativePathString,
        params: { tab: "matches" },
      });
    } catch (err) {
      showScheduleSubmitError(err, "You must be league admin", handleSubmit);
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
    venueId,
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
          venue={selectedVenueLabel}
          venueOptions={venueOptions.map((venue) => venue.label)}
          onDateChange={setDate}
          onStartTimeChange={setStartTimeValue}
          onEndTimeChange={setEndTimeValue}
          onVenueChange={(label) => setVenueId(venueLabelToId[label] ?? "")}
          onAddVenue={() =>
            router.push({
              pathname:
                `/leagues/${leagueId}/matches/add-venue` as RelativePathString,
              params: {
                id: leagueId,
                homeTeamId,
                awayTeamId,
                draftHomeTeamId: homeTeamId,
                draftAwayTeamId: awayTeamId,
                draftDate: date.toISOString(),
                draftStartTime: startTimeValue.toISOString(),
                draftEndTime: endTimeValue.toISOString(),
                draftVenueId: venueId,
                draftRefereeUserId: refereeUserId,
              },
            })
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
