import { GO_TEAM_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";
import { TeamMember } from "@/hooks/use-get-team-members/model";
import { AxiosInstance, AxiosResponse } from "axios";

export const fetchTeamMembers = (
  teamId: string,
  api: AxiosInstance,
): Promise<TeamMember[]> => {
  return api
    .get<
      unknown,
      AxiosResponse<TeamMember[]>
    >(GO_TEAM_SERVICE_ROUTES.GET_TEAM_MEMBERS(teamId))
    .then((res) =>
      (res.data ?? []).map((member) => ({
        ...member,
        id: member.id ?? member.userId,
      })),
    );
};
