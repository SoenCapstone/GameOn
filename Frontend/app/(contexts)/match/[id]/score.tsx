import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
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
import { Header } from "@/components/header/header";
import { PageTitle } from "@/components/header/page-title";
import { Button } from "@/components/ui/button";
import { useMatchPresentation } from "@/hooks/use-match-presentation";
import {
  useSubmitLeagueScore,
  useSubmitTeamScore,
  useTeamMatch,
} from "@/hooks/use-matches";
import { LeagueMatch, TeamMatch } from "@/features/matches/types";
import { errorToString } from "@/utils/error";

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

export default function MatchScoreScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    contextId?: string;
    leagueId?: string;
    startTime?: string;
    homeName?: string;
    awayName?: string;
  }>();
  const matchId = params.id ?? "";
  const contextId = params.contextId ?? "";
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
  const contextMatches =
    queryClient.getQueryData<(TeamMatch | LeagueMatch)[]>([
      "team-matches",
      contextId,
    ]) ?? [];
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
    isLeagueMatch ? contextualMatch : (teamMatchQuery.data ?? contextualMatch)
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
      }

      if (contextId) {
        queryClient.setQueryData<(TeamMatch | LeagueMatch)[] | undefined>(
          ["team-matches", contextId],
          (currentMatches) => {
            if (!currentMatches) return currentMatches;

            return currentMatches.map((existingMatch) => {
              if (existingMatch.id !== matchId) {
                return existingMatch;
              }

              if (isLeagueMatch) {
                return {
                  ...existingMatch,
                  endTime: submittedEndTime,
                  homeScore,
                  awayScore,
                };
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
        pathname: contextId
          ? (`/teams/${contextId}` as RelativePathString)
          : ("/home" as RelativePathString),
        params: contextId ? { tab: "matches" } : undefined,
      });
    } catch (err) {
      Alert.alert("Score submission failed", errorToString(err));
    }
  }, [
    endTimeValue,
    homeScoreText,
    awayScoreText,
    matchId,
    contextId,
    matchStartTime,
    isLeagueMatch,
    submitLeagueScoreMutation,
    submitScoreMutation,
    queryClient,
    router,
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
    if (!isLeagueMatch && teamMatchQuery.isLoading && !match) {
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
  }, [match, matchId, isLeagueMatch, teamMatchQuery.isLoading]);

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
