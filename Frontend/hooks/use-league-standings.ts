import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const useLeagueStandings = (leagueId: string) => {
  return useQuery({
    queryKey: ["league-standings", leagueId],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/leagues/${leagueId}/standings`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch standings");
      }

      const data = await res.json();

      return data.sort((a: any, b: any) => b.points - a.points);
    },
    enabled: !!leagueId,
  });
};