import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useReferee } from "@/contexts/referee-context";
import {
  GO_REFEREE_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { useLeaguesByIds, useTeamsByIds } from "@/hooks/use-matches";
import type { LeagueMatch, TeamMatch } from "@/types/matches";
import { buildMatchCards, splitMatchSections } from "@/utils/matches";
import { toast } from "@/utils/toast";
import { errorToString } from "@/utils/error";

type RefereeMatchesData = {
  leagueMatches: LeagueMatch[];
  teamMatches: TeamMatch[];
};

export function useRefereeMatches() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();
  const { isReferee } = useReferee();

  const query = useQuery<RefereeMatchesData, Error>({
    queryKey: ["referee-matches", userId],
    queryFn: async () => {
      try {
        const [leagueResp, teamResp] = await Promise.all([
          api.get<LeagueMatch[]>(GO_REFEREE_SERVICE_ROUTES.MY_LEAGUE_MATCHES),
          api.get<TeamMatch[]>(GO_REFEREE_SERVICE_ROUTES.MY_TEAM_MATCHES),
        ]);

        return {
          leagueMatches: leagueResp.data ?? [],
          teamMatches: teamResp.data ?? [],
        };
      } catch (error) {
        toast.error("Failed to Load Referee Matches", {
          description: errorToString(error),
        });
        throw error;
      }
    },
    enabled: Boolean(userId && isReferee),
    retry: false,
  });

  const { leagueMatches = [], teamMatches = [] } = query.data ?? {};

  const teamIds = [...leagueMatches, ...teamMatches].flatMap((match) => [
    match.homeTeamId,
    match.awayTeamId,
  ]);

  const leagueIds = leagueMatches.map((match) => match.leagueId);

  const teamsQuery = useTeamsByIds(teamIds);
  const leaguesQuery = useLeaguesByIds(leagueIds);

  const { today, upcoming, past } = useMemo(() => {
    const leagueItems = buildMatchCards(
      leagueMatches ?? [],
      teamsQuery.data,
      (match) =>
        ("leagueId" in match && match.leagueId
          ? leaguesQuery.data?.[match.leagueId]?.name
          : undefined) ?? "League",
    ).map((match) => ({
      ...match,
      space: "league" as const,
      spaceId: match.leagueId ?? "",
    }));

    const teamItems = buildMatchCards(
      teamMatches ?? [],
      teamsQuery.data,
      "Team Match",
    ).map((match) => ({
      ...match,
      space: "team" as const,
      spaceId: match.homeTeamId,
    }));

    return splitMatchSections([...leagueItems, ...teamItems]);
  }, [leagueMatches, teamMatches, leaguesQuery.data, teamsQuery.data]);

  return {
    today,
    upcoming,
    past,
    isLoading:
      query.isLoading || teamsQuery.isLoading || leaguesQuery.isLoading,
    isRefetching:
      query.isRefetching ||
      teamsQuery.isRefetching ||
      leaguesQuery.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
