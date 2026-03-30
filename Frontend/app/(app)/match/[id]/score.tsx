import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { FormToolbar } from "@/components/form/form-toolbar";
import { AccentColors } from "@/constants/colors";
import { useMatchPresentation } from "@/hooks/use-match-presentation";
import { useSubmitTeamScore, useTeamMatch } from "@/hooks/use-matches";
import { LeagueMatch, TeamMatch } from "@/types/matches";
import { errorToString } from "@/utils/error";
import { Loading } from "@/components/ui/loading";
import { Empty } from "@/components/ui/empty";

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

export default function MatchScoreScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    spaceId?: string;
    homeName?: string;
    awayName?: string;
  }>();
  const matchId = params.id ?? "";
  const spaceId = params.spaceId ?? "";

  const router = useRouter();
  const queryClient = useQueryClient();
  const submitScoreMutation = useSubmitTeamScore();

  const [homeScoreText, setHomeScoreText] = useState("");
  const [awayScoreText, setAwayScoreText] = useState("");
  const [endTimeValue, setEndTimeValue] = useState(new Date());

  const teamMatchQuery = useTeamMatch(matchId);
  const match = teamMatchQuery.data;
  const { homeTeam, awayTeam } = useMatchPresentation(match);

  const homeTeamName = homeTeam?.name ?? params.homeName?.trim() ?? "Home Team";
  const awayTeamName = awayTeam?.name ?? params.awayName?.trim() ?? "Away Team";
  const matchStartTime = useMemo(
    () => (match?.startTime ? new Date(match.startTime) : null),
    [match?.startTime],
  );

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
      const submittedEndTime = endTimeValue.toISOString();

      await submitScoreMutation.mutateAsync({
        matchId,
        homeScore,
        awayScore,
        endTime: submittedEndTime,
      });

      queryClient.setQueryData<TeamMatch | undefined>(
        ["team-match", matchId],
        (currentMatch) => {
          if (!currentMatch) return currentMatch;
          return {
            ...currentMatch,
            status: "COMPLETED",
            endTime: submittedEndTime,
            homeScore,
            awayScore,
          };
        },
      );

      if (spaceId) {
        queryClient.setQueryData<(TeamMatch | LeagueMatch)[] | undefined>(
          ["team-matches", spaceId],
          (currentMatches) => {
            if (!currentMatches) return currentMatches;

            return currentMatches.map((existingMatch) => {
              if (existingMatch.id !== matchId) {
                return existingMatch;
              }

              if (!("matchType" in existingMatch)) {
                return existingMatch;
              }

              return {
                ...existingMatch,
                status: "COMPLETED",
                endTime: submittedEndTime,
                homeScore,
                awayScore,
              };
            });
          },
        );
      }

      await queryClient.invalidateQueries({ queryKey: ["user-updates"] });

      router.dismissTo({
        pathname: spaceId
          ? (`/teams/${spaceId}` as RelativePathString)
          : ("/home" as RelativePathString),
        params: spaceId ? { tab: "matches" } : undefined,
      });
    } catch (err) {
      Alert.alert("Score submission failed", errorToString(err));
    }
  }, [
    endTimeValue,
    homeScoreText,
    awayScoreText,
    matchId,
    spaceId,
    matchStartTime,
    submitScoreMutation,
    queryClient,
    router,
  ]);

  const loadingState = useMemo(() => {
    if (teamMatchQuery.isLoading && !match) {
      return <Loading />;
    }

    if (!matchId) {
      return <Empty message="Match not found" />;
    }

    return null;
  }, [match, matchId, teamMatchQuery.isLoading]);

  if (loadingState) {
    return loadingState;
  }

  return (
    <ContentArea
      toolbar={
        <FormToolbar
          title="Match Score"
          onSubmit={onSubmit}
          loading={submitScoreMutation.isPending}
        />
      }
    >
      <Form accentColor={AccentColors.red}>
        <FormToolbar
          title="Match Score"
          onSubmit={onSubmit}
          loading={submitScoreMutation.isPending}
        />
        <Form.Section>
          <Form.Input
            label={homeTeamName}
            value={homeScoreText}
            onChangeText={setHomeScoreText}
            keyboardType="number-pad"
            placeholder="Enter score"
            editable={!submitScoreMutation.isPending}
          />
          <Form.Input
            label={awayTeamName}
            value={awayScoreText}
            onChangeText={setAwayScoreText}
            keyboardType="number-pad"
            placeholder="Enter score"
            editable={!submitScoreMutation.isPending}
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
