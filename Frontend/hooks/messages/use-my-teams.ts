import { fetchMyTeams } from "@/hooks/messages/api";
import { messagingKeys, type TeamSummaryResponse } from "@/constants/messaging";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

export function useMyTeams() {
  const api = useAxiosWithClerk();
  const { userId } = useAuth();

  return useQuery<TeamSummaryResponse[]>({
    queryKey: messagingKeys.myTeams(userId),
    queryFn: () => fetchMyTeams(api),
    staleTime: 60_000,
    refetchOnMount: false,
    enabled: Boolean(userId),
  });
}
