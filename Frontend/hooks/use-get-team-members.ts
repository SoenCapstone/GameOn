import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { TeamMember } from "@/types/team-member";
import { fetchTeamMembers } from "@/utils/team-members";

export const useGetTeamMembers = (teamId: string) => {
  const api = useAxiosWithClerk();
  return useQuery<TeamMember[]>({
    queryKey: ["team-members", teamId],
    queryFn: async () => fetchTeamMembers(teamId, api),
  });
};
