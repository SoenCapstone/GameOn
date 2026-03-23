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
import { useSubmitTeamScore, useTeamMatch } from "@/hooks/use-matches";
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
    homeName?: string;
    awayName?: string;
  }>();
  const matchId = params.id ?? "";
  const contextId = params.contextId ?? "";

  const navigation = useNavigation();
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

      if (contextId) {
        queryClient.setQueryData<(TeamMatch | LeagueMatch)[] | undefined>(
          ["team-matches", contextId],
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
    submitScoreMutation,
    queryClient,
    router,
  ]);

  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () =>
        renderScoreHeader(
          () => submitRef.current(),
          submitScoreMutation.isPending,
        ),
    });
  }, [navigation, submitScoreMutation.isPending]);

  const loadingState = useMemo(() => {
    if (teamMatchQuery.isLoading && !match) {
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
  }, [match, matchId, teamMatchQuery.isLoading]);

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
