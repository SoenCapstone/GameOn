import { AxiosInstance } from "axios";
import { fetchTeamResults } from "@/components/browse/utils";
import {
  GO_LEAGUE_INVITE_ROUTES,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";

export type LeagueInviteResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  status?: string | null;
};

export type LeagueInviteCard = {
  kind: "league";
  id: string;
  leagueId: string;
  leagueName: string;
  teamId: string;
  teamName: string;
};

export async function fetchPendingLeagueInvites(
  api: AxiosInstance,
  leagueId: string,
): Promise<LeagueInviteResponse[]> {
  const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.INVITES(leagueId), {
    params: { status: "PENDING" },
  });
  return (resp.data ?? []).filter((invite: LeagueInviteResponse) => invite.status === "PENDING");
}

export async function fetchLeagueInvitesWithDetails(
  api: AxiosInstance,
): Promise<LeagueInviteCard[]> {
  const teamResp = await fetchTeamResults(api, "", true);
  const teams = teamResp.items ?? [];

  if (teams.length === 0) return [];

  const leagueInvitesNested = await Promise.all(
    teams.map(async (team) => {
      try {
        const resp = await api.get<LeagueInviteResponse[]>(
          GO_LEAGUE_INVITE_ROUTES.TEAM_INVITES(team.id),
        );
        const pending = (resp.data ?? []).filter(
          (invite) => invite.status === "PENDING",
        );
        return pending.map((invite) => ({
          ...invite,
          teamName: team.name ?? "Team",
        }));
      } catch {
        return [];
      }
    }),
  );

  const flatInvites = leagueInvitesNested.flat();
  if (flatInvites.length === 0) return [];

  const leagueIds = Array.from(new Set(flatInvites.map((invite) => invite.leagueId)));
  const leagueMap = await fetchLeagueNameMap(api, leagueIds);

  return flatInvites.map((invite) => ({
    kind: "league" as const,
    id: invite.id,
    leagueId: invite.leagueId,
    leagueName: leagueMap[invite.leagueId] ?? "League",
    teamId: invite.teamId,
    teamName: invite.teamName ?? "Team",
  }));
}

async function fetchLeagueNameMap(
  api: AxiosInstance,
  leagueIds: string[],
) {
  const entries = await Promise.all(
    leagueIds.map(async (leagueId) => {
      try {
        const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.GET(leagueId));
        return [leagueId, resp.data?.name ?? "League"] as const;
      } catch {
        return [leagueId, "League"] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}
