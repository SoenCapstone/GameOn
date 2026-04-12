import { useQuery } from "@tanstack/react-query";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

export const usePlayDetails = (teamId: string, playId: string | null) => {
  const api = useAxiosWithClerk();

  return useQuery({
    queryKey: ["play-details", teamId, playId],
    queryFn: async () => {
      const route = GO_TEAM_SERVICE_ROUTES.GET_PLAY(teamId, playId!);
      const response = await api.get(route);
      return response.data;
    },
    enabled: !!teamId && !!playId,
  });
};
