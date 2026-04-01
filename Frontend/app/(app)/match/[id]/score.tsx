import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { FormToolbar } from "@/components/form/form-toolbar";
import { AccentColors } from "@/constants/colors";
import { useMatchPresentation } from "@/hooks/use-match-presentation";
import {
  useLeagueMatch,
  useSubmitLeagueScore,
  useSubmitTeamScore,
  useTeamMatch,
} from "@/hooks/use-matches";
import type { MatchSpace } from "@/types/match-details";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import { errorToString } from "@/utils/error";
import { Empty } from "@/components/ui/empty";
import { Loading } from "@/components/ui/loading";

type MatchScoreRouteParams = {
  id?: string;
  space?: MatchSpace;
  spaceId?: string;
  leagueId?: string;
  startTime?: string;
  homeName?: string;
  awayName?: string;
};

function parseScore(rawValue: string) {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const value = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

async function invalidateQueriesAfterScoreSubmit(args: {
  isLeagueMatch: boolean;
  leagueId: string;
  matchId: string;
  queryClient: ReturnType<typeof useQueryClient>;
  space?: MatchSpace;
  spaceId: string;
}) {
  const { isLeagueMatch, leagueId, matchId, queryClient, space, spaceId } =
    args;
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({ queryKey: ["user-updates"] }),
  ];

  if (spaceId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: [space === "league" ? "league-matches" : "team-matches", spaceId],
      }),
    );
  }

  if (isLeagueMatch) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: ["league-match", leagueId, matchId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["league-matches", leagueId],
      }),
    );
  } else {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: ["team-match", matchId],
      }),
    );
  }

  await Promise.all(tasks);
}

export default function MatchScoreScreen() {
  const params = useLocalSearchParams<MatchScoreRouteParams>();
  const matchId = params.id ?? "";
  const space = params.space;
  const spaceId = params.spaceId ?? "";
  const leagueId = params.leagueId ?? "";
  const isLeagueMatch = Boolean(leagueId);

  const router = useRouter();
  const queryClient = useQueryClient();
  const submitLeagueScoreMutation = useSubmitLeagueScore(leagueId);
  const submitTeamScoreMutation = useSubmitTeamScore();

  const [homeScoreText, setHomeScoreText] = useState("");
  const [awayScoreText, setAwayScoreText] = useState("");
  const [endTimeValue, setEndTimeValue] = useState(new Date());

  const teamMatchQuery = useTeamMatch(matchId, !isLeagueMatch);
  const leagueMatchQuery = useLeagueMatch(leagueId, matchId, isLeagueMatch);
  const contextMatchesQueryKey = useMemo(
    () =>
      spaceId
        ? ([space === "league" ? "league-matches" : "team-matches", spaceId] as const)
        : null,
    [space, spaceId],
  );
  const contextMatches =
    (contextMatchesQueryKey
      ? queryClient.getQueryData<(TeamMatch | LeagueMatch)[]>(contextMatchesQueryKey)
      : undefined) ?? [];
  const contextualMatch = contextMatches.find((existingMatch) => {
    if (existingMatch.id !== matchId) {
      return false;
    }

    if (!isLeagueMatch) {
      return !("leagueId" in existingMatch);
    }

    return "leagueId" in existingMatch && existingMatch.leagueId === leagueId;
  });
  const match = (
    isLeagueMatch
      ? (leagueMatchQuery.data ?? contextualMatch)
      : (teamMatchQuery.data ?? contextualMatch)
  ) as TeamMatch | LeagueMatch | undefined;
  const { homeTeam, awayTeam } = useMatchPresentation(match);

  const homeTeamName = homeTeam?.name ?? params.homeName?.trim() ?? "Home Team";
  const awayTeamName = awayTeam?.name ?? params.awayName?.trim() ?? "Away Team";
  const matchStartTime = useMemo(() => {
    const rawStartTime = match?.startTime ?? params.startTime;
    return rawStartTime ? new Date(rawStartTime) : null;
  }, [match?.startTime, params.startTime]);
  const isSubmitting =
    submitTeamScoreMutation.isPending || submitLeagueScoreMutation.isPending;

  const onSubmit = useCallback(async () => {
    if (!matchId) {
      Alert.alert("Score submission failed", "Match was not provided.");
      return;
    }

    const homeScore = parseScore(homeScoreText);
    const awayScore = parseScore(awayScoreText);

    if (homeScore == null || awayScore == null) {
      Alert.alert(
        "Score submission failed",
        "Enter valid non-negative scores for both teams.",
      );
      return;
    }

    if (matchStartTime && endTimeValue.getTime() <= matchStartTime.getTime()) {
      Alert.alert(
        "Score submission failed",
        "End time must be after the match start time.",
      );
      return;
    }

    try {
      const endTime = endTimeValue.toISOString();

      if (isLeagueMatch) {
        await submitLeagueScoreMutation.mutateAsync({
          matchId,
          homeScore,
          awayScore,
          endTime,
        });
      } else {
        await submitTeamScoreMutation.mutateAsync({
          matchId,
          homeScore,
          awayScore,
          endTime,
        });
      }

      await invalidateQueriesAfterScoreSubmit({
        isLeagueMatch,
        leagueId,
        matchId,
        queryClient,
        space,
        spaceId,
      });

      router.dismiss();
    } catch (err) {
      Alert.alert("Score submission failed", errorToString(err));
    }
  }, [
    awayScoreText,
    endTimeValue,
    homeScoreText,
    isLeagueMatch,
    leagueId,
    matchId,
    matchStartTime,
    queryClient,
    router,
    space,
    spaceId,
    submitLeagueScoreMutation,
    submitTeamScoreMutation,
  ]);

  const isMatchLoading = isLeagueMatch
    ? leagueMatchQuery.isLoading
    : teamMatchQuery.isLoading;

  if (isMatchLoading && !match) {
    return <Loading />;
  }

  if (!matchId) {
    return <Empty message="Match not found" />;
  }

  return (
    <ContentArea
      toolbar={
        <FormToolbar
          title="Match Score"
          onSubmit={onSubmit}
          loading={isSubmitting}
        />
      }
    >
      <Form accentColor={AccentColors.red}>
        <Form.Section>
          <Form.Input
            label={homeTeamName}
            value={homeScoreText}
            onChangeText={setHomeScoreText}
            keyboardType="number-pad"
            placeholder="Enter score"
            editable={!isSubmitting}
          />
          <Form.Input
            label={awayTeamName}
            value={awayScoreText}
            onChangeText={setAwayScoreText}
            keyboardType="number-pad"
            placeholder="Enter score"
            editable={!isSubmitting}
          />
          <Form.DateTime
            label="End Time"
            value={endTimeValue}
            mode="time"
            display="default"
            minimumDate={matchStartTime ?? undefined}
            onChange={(_event, selectedDate) => {
              if (selectedDate) {
                setEndTimeValue(selectedDate);
              }
            }}
          />
        </Form.Section>
      </Form>
    </ContentArea>
  );
}
