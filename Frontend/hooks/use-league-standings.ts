import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "./use-axios-clerk";

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
  const api = useAxiosWithClerk();

  return useQuery<Standing[], Error>({
    queryKey: ["league-standings", leagueId],

    queryFn: async () => {
      const res = await api.get(
        `${API_BASE_URL}/api/v1/leagues/${leagueId}/standings`
      );

      return res.data.sort(
        (a: Standing, b: Standing) => (b.points ?? 0) - (a.points ?? 0)
      );
    },

    enabled: !!leagueId,
  });
};