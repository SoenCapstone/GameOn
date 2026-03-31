import { useQuery } from "@tanstack/react-query";
import {
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

export const useTeamPlays = (teamId: string) => {
  const api = useAxiosWithClerk();

  return useQuery({
    queryKey: ["team-plays", teamId],
    queryFn: async () => {
      const route = GO_TEAM_SERVICE_ROUTES.GET_PLAYS
        ? GO_TEAM_SERVICE_ROUTES.GET_PLAYS(teamId)
        : `/api/v1/teams/${teamId}/plays`;
      const response = await api.get(route);
      return response.data;
    },
    enabled: !!teamId,
  });
};