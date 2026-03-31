import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ContentArea } from "@/components/ui/content-area";
import { Form } from "@/components/form/form";
import { AccentColors } from "@/constants/colors";
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useMatchPresentation } from "@/hooks/use-match-presentation";
import {
  useLeagueMatch,
  useSubmitLeagueScore,
  useSubmitTeamScore,
  useTeamMatch,
} from "@/hooks/use-matches";
import { LeagueMatch, TeamMatch } from "@/features/matches/types";
import { errorToString } from "@/utils/error";

type MatchContextType = "team" | "league";

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

function renderScoreHeader(onSave: () => void, isPending: boolean) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title="Match Score" />}
      right={
        <Button
          type="custom"
          label="Save"
          onPress={onSave}
          loading={isPending}
          isInteractive={!isPending}
        />
      }
    />
  );
}

async function invalidateQueriesAfterScoreSubmit({
  queryClient,
  contextId,
  contextMatchesQueryKey,
  isLeagueMatch,
  leagueId,
  matchId,
}: {
  queryClient: QueryClient;
  contextId: string;
  contextMatchesQueryKey: readonly ["league-matches" | "team-matches", string];
  isLeagueMatch: boolean;
  leagueId: string;
  matchId: string;
}) {
  if (contextId) {
    await queryClient.invalidateQueries({
      queryKey: contextMatchesQueryKey,
    });
  }

  if (isLeagueMatch && leagueId) {
    await queryClient.invalidateQueries({
      queryKey: ["league-match", leagueId, matchId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["league-matches", leagueId],
    });
  }

  if (!isLeagueMatch) {
    await queryClient.invalidateQueries({
      queryKey: ["team-match", matchId],
    });
  }

  await queryClient.invalidateQueries({ queryKey: ["user-updates"] });
}

function resolveDestinationPath(
  contextId: string,
  contextType: MatchContextType,
): RelativePathString {
  if (!contextId) {
    return "/home" as RelativePathString;
  }

  return contextType === "league"
    ? (`/leagues/${contextId}` as RelativePathString)
    : (`/teams/${contextId}` as RelativePathString);
}

export default function MatchScoreScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    contextId?: string;
    contextType?: MatchContextType;
    leagueId?: string;
    startTime?: string;
    homeName?: string;
    awayName?: string;
  }>();
  const matchId = params.id ?? "";
  const contextId = params.contextId ?? "";
  const contextType = params.contextType === "league" ? "league" : "team";
  const leagueId = params.leagueId ?? "";
  const isLeagueMatch = Boolean(leagueId);

  const navigation = useNavigation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submitLeagueScoreMutation = useSubmitLeagueScore(leagueId);
  const submitScoreMutation = useSubmitTeamScore();

  const [homeScoreText, setHomeScoreText] = useState("");
  const [awayScoreText, setAwayScoreText] = useState("");
  const [endTimeValue, setEndTimeValue] = useState(new Date());

  const teamMatchQuery = useTeamMatch(matchId, !isLeagueMatch);
  const leagueMatchQuery = useLeagueMatch(leagueId, matchId, isLeagueMatch);
  const contextMatchesQueryKey = useMemo(
    () =>
      contextType === "league"
        ? (["league-matches", contextId] as const)
        : (["team-matches", contextId] as const),
    [contextType, contextId],
  );
  const contextMatches =
    queryClient.getQueryData<(TeamMatch | LeagueMatch)[]>(
      contextMatchesQueryKey,
    ) ?? [];
  const contextualMatch = contextMatches.find((existingMatch) => {
    if (existingMatch.id !== matchId) {
      return false;
    }

    if (!isLeagueMatch) {
      return "matchType" in existingMatch;
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
  const fallbackStartTime = params.startTime;

  const matchStartTime = useMemo(() => {
    const rawStartTime = match?.startTime ?? fallbackStartTime;
    return rawStartTime ? new Date(rawStartTime) : null;
  }, [match?.startTime, fallbackStartTime]);

  const isSubmitting =
    submitScoreMutation.isPending || submitLeagueScoreMutation.isPending;

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

      if (isLeagueMatch) {
        await submitLeagueScoreMutation.mutateAsync({
          matchId,
          homeScore,
          awayScore,
          endTime: submittedEndTime,
        });
      } else {
        await submitScoreMutation.mutateAsync({
          matchId,
          homeScore,
          awayScore,
          endTime: submittedEndTime,
        });
      }

      await invalidateQueriesAfterScoreSubmit({
        queryClient,
        contextId,
        contextMatchesQueryKey,
        isLeagueMatch,
        leagueId,
        matchId,
      });

      const destinationPath = resolveDestinationPath(contextId, contextType);

      router.dismissTo({
        pathname: destinationPath,
        params: contextId ? { tab: "matches" } : undefined,
      });
    } catch (err) {
      Alert.alert("Score submission failed", errorToString(err));
    }
  }, [
    matchId,
    homeScoreText,
    awayScoreText,
    matchStartTime,
    endTimeValue,
    isLeagueMatch,
    contextId,
    leagueId,
    contextType,
    queryClient,
    router,
    submitLeagueScoreMutation,
    submitScoreMutation,
    contextMatchesQueryKey,
  ]);

  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () =>
        renderScoreHeader(() => submitRef.current(), isSubmitting),
    });
  }, [navigation, isSubmitting]);

  const loadingState = useMemo(() => {
    const isMatchLoading = isLeagueMatch
      ? leagueMatchQuery.isLoading
      : teamMatchQuery.isLoading;

    if (isMatchLoading && !match) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      );
    }

    if (!matchId) {
      return <Text style={styles.empty}>Match not found</Text>;
    }

    return null;
  }, [
    match,
    matchId,
    isLeagueMatch,
    teamMatchQuery.isLoading,
    leagueMatchQuery.isLoading,
  ]);

  if (loadingState) {
    return loadingState;
  }

  return (
    <ContentArea scrollable backgroundProps={{ preset: "red", mode: "form" }}>
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

const styles = StyleSheet.create({
  loading: {
    marginTop: 24,
    alignItems: "center",
  },
  empty: {
    color: "#fff",
    fontSize: 16,
    marginTop: 24,
  },
});
