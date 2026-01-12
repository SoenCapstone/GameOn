import { GO_TEAM_SERVICE_ROUTES } from "../use-axios-clerk";

export const fetchTeamMembers =  (teamId: string, api: any) => {
    return api.get(GO_TEAM_SERVICE_ROUTES.GET_TEAM_MEMBERS(teamId)).then((res: any) => res.data);
}