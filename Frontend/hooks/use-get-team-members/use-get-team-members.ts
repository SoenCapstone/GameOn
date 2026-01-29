import { useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "../use-axios-clerk";
import { fetchTeamMembers } from "./utils";
import { TeamMember } from "./model";

export const useGetTeamMembers = (teamId: string) => {
    const api = useAxiosWithClerk();
    return useQuery<TeamMember[]>({
        queryKey: ["team-members", teamId],
        queryFn: async () => fetchTeamMembers(teamId, api),
    }); 
}
