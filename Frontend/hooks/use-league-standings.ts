import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type Standing = {
  teamId: string;
  played?: number;
  gamesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  points?: number;
};

export const useLeagueStandings = (leagueId: string) => {
  return useQuery<Standing[], Error>({
    queryKey: ["league-standings", leagueId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/leagues/${leagueId}/standings`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch standings");
      }

      const data: Standing[] = await res.json();

      // sort by points descending
      return data.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    },
    enabled: !!leagueId,
  });
};