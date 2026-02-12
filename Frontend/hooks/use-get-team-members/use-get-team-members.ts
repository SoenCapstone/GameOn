import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { fetchTeamMembers } from "@/hooks/use-get-team-members/utils";
import { TeamMember } from "@/hooks/use-get-team-members/model";

export const useGetTeamMembers = (teamId: string) => {
    const api = useAxiosWithClerk();
    return useQuery<TeamMember[]>({
        queryKey: ["team-members", teamId],
        queryFn: async () => fetchTeamMembers(teamId, api),
    }); 
}
