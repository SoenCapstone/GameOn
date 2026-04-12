import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import {
  buildVenueOptionMaps,
  buildVenueOptions,
  getBlockedScheduleValidationMessage,
  resolveSelectedVenueLabel,
} from "@/utils/schedule";
import {
  useCreateLeagueMatch,
  useLeagueTeams,
  useLeagueVenues,
  useReferees,
  useTeamsByIds,
  useValidateLeagueMatchSchedule,
} from "@/hooks/use-matches";
import { useLeagueDetail } from "@/hooks/use-league-detail";
import { toast } from "@/utils/toast";
import {
  buildStartEndIso,
  formatLocalDateString,
  parseDraftDate,
} from "@/utils/date";
import { createScopedLog } from "@/utils/logger";
import { showScheduleSubmitError } from "@/utils/schedule-errors";
import { useRefereeOptions } from "@/hooks/use-referee-options";
import { MatchDetailsSection } from "@/components/matches/match-details-section";
import { FormToolbar } from "@/components/form/form-toolbar";

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
    draftVenueId?: string;
    draftRefereeUserId?: string;
  }>();
  const leagueId = params.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [refereeUserId, setRefereeUserId] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTimeValue, setStartTimeValue] = useState(new Date());
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
    if (params.draftVenueId && !params.newVenueId) {
      setVenueId(params.draftVenueId);
    }
    if (params.draftRefereeUserId) {
      setRefereeUserId(params.draftRefereeUserId);
    }
  }, [
    params.draftAwayTeamId,
    params.draftDate,
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
  const validateMutation = useValidateLeagueMatchSchedule(leagueId);

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
  const selectedRefereeLabel = refereeUserId
    ? (refereeIdToLabel[refereeUserId] ?? refereeUserId)
    : undefined;
  const scheduleTeamNamesById = useMemo(
    () => ({
      ...(homeTeamId
        ? {
            [homeTeamId]:
              teams.find((team) => team.id === homeTeamId)?.name ?? "Home team",
          }
        : {}),
      ...(awayTeamId
        ? {
            [awayTeamId]:
              teams.find((team) => team.id === awayTeamId)?.name ?? "Away team",
          }
        : {}),
    }),
    [awayTeamId, homeTeamId, teams],
  );

  useEffect(() => {
    if (teamsQuery.error) {
      log.error("Failed to load league teams for schedule", teamsQuery.error);
      toast.error("Load Error", {
        description: "Could not load teams. Please retry.",
      });
    }
    if (venuesQuery.error) {
      log.error("Failed to load league venues for schedule", venuesQuery.error);
      toast.error("Load Error", {
        description: "Could not load venues. Please retry.",
      });
    }
    if (refereesQuery.error) {
      log.error("Failed to load referees for schedule", refereesQuery.error);
      toast.error("Load Error", {
        description: "Could not load referees. Please retry.",
      });
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
    if (
      !homeTeamId ||
      !awayTeamId ||
      !date ||
      !startTimeValue ||
      !venueId ||
      !refereeUserId
    ) {
      toast.error("Match Schedule Failed", {
        description: "Fill all required fields",
      });
      return;
    }
    if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
      toast.error("Match Schedule Failed", {
        description: "Home and away teams must be different",
      });
      return;
    }

    const startTime = new Date(startTimeValue);
    const endTime = new Date(startTimeValue);
    endTime.setMinutes(endTime.getMinutes() + 15);

    const { startTime: startTimeIso, endTime: endTimeIso } = buildStartEndIso(
      date,
      startTime,
      endTime,
    );
    const scheduledDate = formatLocalDateString(date);

    try {
      const validation = await validateMutation.mutateAsync({
        homeTeamId,
        awayTeamId,
        scheduledDate,
        startTime: startTimeIso,
        endTime: endTimeIso,
        venueId,
        refereeUserId,
      });

      const validationMessage = getBlockedScheduleValidationMessage(
        validation,
        scheduleTeamNamesById,
      );
      if (validationMessage) {
        toast.error("Match Schedule Failed", {
          description: validationMessage,
        });
        return;
      }

      await createMutation.mutateAsync({
        homeTeamId,
        awayTeamId,
        scheduledDate,
        startTime: startTimeIso,
        endTime: endTimeIso,
        venueId,
        refereeUserId,
      });

      await queryClient.invalidateQueries({
        queryKey: ["league-matches", leagueId],
      });
      toast.success("Match Scheduled");
      router.dismissTo({
        pathname: `/leagues/${leagueId}` as RelativePathString,
        params: { tab: "matches" },
      });
    } catch (err) {
      showScheduleSubmitError(
        err,
        "You must be league admin",
        handleSubmit,
        scheduleTeamNamesById,
      );
    }
  }, [
    awayTeamId,
    createMutation,
    validateMutation,
    date,
    homeTeamId,
    leagueId,
    queryClient,
    refereeUserId,
    router,
    scheduleTeamNamesById,
    startTimeValue,
    venueId,
  ]);

  return (
    <ContentArea
      background={{ preset: "red", mode: "form" }}
      toolbar={
        <FormToolbar
          title="Schedule a Match"
          icon="calendar.badge.plus"
          onSubmit={handleSubmit}
          loading={createMutation.isPending}
        />
      }
    >
      <Form accentColor={AccentColors.red}>
        <Form.Section header="Teams">
          <Form.Menu
            label="Home Team"
            options={homeTeamOptions}
            value={teams.find((team) => team.id === homeTeamId)?.name}
            placeholder={
              homeTeamOptions.length === 0
                ? "No teams available"
                : "Select team"
            }
            onValueChange={(value) => setHomeTeamId(teamNameToId[value])}
            disabled={
              createMutation.isPending ||
              validateMutation.isPending ||
              teamsQuery.isLoading ||
              homeTeamOptions.length === 0
            }
          />

          <Form.Menu
            label="Away Team"
            options={awayTeamOptions}
            value={teams.find((team) => team.id === awayTeamId)?.name}
            placeholder={
              awayTeamOptions.length === 0
                ? "No teams available"
                : "Select team"
            }
            onValueChange={(value) => setAwayTeamId(teamNameToId[value])}
            disabled={
              createMutation.isPending ||
              validateMutation.isPending ||
              teamsQuery.isLoading ||
              awayTeamOptions.length === 0
            }
          />
        </Form.Section>

        <MatchDetailsSection
          date={date}
          startTimeValue={startTimeValue}
          venue={selectedVenueLabel}
          venueOptions={venueOptions.map((venue) => venue.label)}
          onDateChange={setDate}
          onStartTimeChange={setStartTimeValue}
          onVenueChange={(label) => setVenueId(venueLabelToId[label] ?? "")}
          onAddVenue={() =>
            router.push({
              pathname:
                `/leagues/${leagueId}/matches/add-venue` as RelativePathString,
              params: {
                homeTeamId,
                awayTeamId,
                draftHomeTeamId: homeTeamId,
                draftAwayTeamId: awayTeamId,
                draftDate: date.toISOString(),
                draftStartTime: startTimeValue.toISOString(),
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
            value={selectedRefereeLabel}
            placeholder={
              refereeOptions.length === 0
                ? "No referees available"
                : "Select referee"
            }
            onValueChange={(value) =>
              setRefereeUserId(refereeLabelToId[value] ?? value)
            }
            disabled={
              createMutation.isPending ||
              validateMutation.isPending ||
              refereesQuery.isLoading ||
              refereeOptions.length === 0
            }
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
