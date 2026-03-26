import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { FormToolbar } from "@/components/form/form-toolbar";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { useTeamDetail } from "@/hooks/use-team-detail";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import {
  useCreateTeamMatch,
  useReferees,
  useTeamVenues,
} from "@/hooks/use-matches";
import {
  buildVenueOptionMaps,
  buildVenueOptions,
  buildStartEndIso,
  isValidTimeRange,
  resolveSelectedVenueLabel,
} from "@/utils/matches";
import { toast } from "@/components/sign-up/utils";
import { parseDraftDate } from "@/utils/date";
import { createScopedLog } from "@/utils/logger";
import { showScheduleSubmitError } from "@/utils/schedule-errors";
import { useRefereeOptions } from "@/hooks/use-referee-options";
import { MatchDetailsSection } from "@/components/matches/match-details-section";

const log = createScopedLog("Schedule Team Match");

type TeamSummary = {
  id: string;
  name: string;
  sport?: string | null;
};

export default function ScheduleTeamMatchScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    newVenueId?: string;
    newVenueName?: string;
    draftAwayTeamId?: string;
    draftDate?: string;
    draftStartTime?: string;
    draftEndTime?: string;
    draftVenueId?: string;
    draftRequiresReferee?: string;
    draftRefereeUserId?: string;
  }>();
  const teamId = params.id ?? "";
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
  const [venueId, setVenueId] = useState("");
  const [requiresReferee, setRequiresReferee] = useState(false);
  const [refereeUserId, setRefereeUserId] = useState("");

  useEffect(() => {
    if (params.newVenueId) {
      setVenueId(params.newVenueId);
    }
  }, [params.newVenueId]);

  useEffect(() => {
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
    if (params.draftRequiresReferee) {
      setRequiresReferee(params.draftRequiresReferee === "true");
    }
    if (params.draftRefereeUserId) {
      setRefereeUserId(params.draftRefereeUserId);
    }
  }, [
    params.draftAwayTeamId,
    params.draftDate,
    params.draftEndTime,
    params.draftRefereeUserId,
    params.draftRequiresReferee,
    params.draftStartTime,
    params.draftVenueId,
    params.newVenueId,
  ]);

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

  const venuesQuery = useTeamVenues({
    homeTeamId: teamId,
    awayTeamId: awayTeamId || undefined,
    enabled: Boolean(teamId),
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
    if (venuesQuery.error) {
      log.error("Failed to load venues for team schedule", venuesQuery.error);
      Alert.alert("Load error", "Could not load venues. Please retry.");
    }
    if (refereesQuery.error) {
      log.error(
        "Failed to load referees for team schedule",
        refereesQuery.error,
      );
      Alert.alert("Load error", "Could not load referees. Please retry.");
    }
  }, [refereesQuery.error, teamSearch.error, venuesQuery.error]);

  useEffect(() => {
    if (params.newVenueId) {
      refetchVenues().catch((err) => {
        log.error("Failed to refresh venues after venue creation", err);
      });
    }
  }, [params.newVenueId, refetchVenues]);

  const handleSubmit = useCallback(async () => {
    if (!awayTeamId) {
      Alert.alert("Match schedule failed", "Away team is required");
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
        venueId,
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
      router.dismissTo({
        pathname: `/teams/${teamId}` as RelativePathString,
        params: { tab: "matches" },
      });
    } catch (err) {
      showScheduleSubmitError(
        err,
        "Only team owner can schedule matches",
        handleSubmit,
      );
    }
  }, [
    awayTeamId,
    date,
    startTimeValue,
    endTimeValue,
    venueId,
    requiresReferee,
    refereeUserId,
    createMutation,
    teamId,
    team?.sport,
    queryClient,
    router,
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
            options={[team?.name ?? "My Team"]}
            value={team?.name ?? "My Team"}
            onValueChange={() => {}}
            disabled={true}
          />
          <Form.Menu
            label="Away Team"
            options={awayTeamOptions}
            value={
              awayTeams.find((candidate) => candidate.id === awayTeamId)?.name
            }
            placeholder={
              awayTeamOptions.length === 0
                ? "No teams available"
                : "Select team"
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
          venue={selectedVenueLabel}
          venueOptions={venueOptions.map((venue) => venue.label)}
          onDateChange={setDate}
          onStartTimeChange={setStartTimeValue}
          onEndTimeChange={setEndTimeValue}
          onVenueChange={(label) => setVenueId(venueLabelToId[label] ?? "")}
          onAddVenue={() =>
            router.push({
              pathname:
                `/teams/${teamId}/matches/add-venue` as RelativePathString,
              params: {
                homeTeamId: teamId,
                awayTeamId,
                draftAwayTeamId: awayTeamId,
                draftDate: date.toISOString(),
                draftStartTime: startTimeValue.toISOString(),
                draftEndTime: endTimeValue.toISOString(),
                draftVenueId: venueId,
                draftRequiresReferee: String(requiresReferee),
                draftRefereeUserId: refereeUserId,
              },
            })
          }
        />

        <Form.Section
          header="Referee"
          footer={
            requiresReferee
              ? undefined
              : "An official match requires a referee."
          }
        >
          <Form.Switch
            label="Official Match"
            value={requiresReferee}
            onValueChange={setRequiresReferee}
          />

          {requiresReferee ? (
            <Form.Menu
              label="Choose Referee"
              options={refereeOptions}
              value={
                refereeUserId ??
                refereeIdToLabel[refereeUserId] ??
                refereeUserId
              }
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
