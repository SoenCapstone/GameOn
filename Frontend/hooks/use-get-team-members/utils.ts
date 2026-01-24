import { GO_TEAM_SERVICE_ROUTES } from "../use-axios-clerk";
import type { AxiosInstance, AxiosResponse } from "axios";
import { TeamMember } from "./model";

export const fetchTeamMembers = (
  teamId: string,
  api: AxiosInstance,
): Promise<TeamMember[]> => {
  return api
    .get(GO_TEAM_SERVICE_ROUTES.GET_TEAM_MEMBERS(teamId))
    .then((res: AxiosResponse<TeamMember[]>) =>
      (res.data ?? []).map((member: TeamMember) => ({
        ...member,
        id: member.id ?? member.userId,
      })),
    );
};
