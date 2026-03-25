import { AxiosInstance } from "axios";
import { fetchTeamResults } from "@/utils/search";
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

export enum LeaguePrivacy {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

function parseLeaguePrivacy(value: unknown): LeaguePrivacy | null {
  return value === LeaguePrivacy.PUBLIC || value === LeaguePrivacy.PRIVATE
    ? value
    : null;
}

export type LeagueInviteCard = {
  kind: "league";
  id: string;
  leagueId: string;
  leagueName: string;
  teamId: string;
  teamName: string;
  leaguePrivacy: LeaguePrivacy;
  logoUrl?: string | null;
  sport?: string | null;
};

export async function fetchPendingLeagueInvites(
  api: AxiosInstance,
  leagueId: string,
): Promise<LeagueInviteResponse[]> {
  const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.INVITES(leagueId), {
    params: { status: "PENDING" },
  });

  const invites = (resp.data ?? []) as LeagueInviteResponse[];
  return invites.filter((invite) => invite.status === "PENDING");
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

  const leagueIds = Array.from(new Set(flatInvites.map((i) => i.leagueId)));

  const leagueMap = await fetchLeagueMetaMap(api, leagueIds);

  return flatInvites.map((invite) => ({
    kind: "league" as const,
    id: invite.id,
    leagueId: invite.leagueId,
    leagueName: leagueMap[invite.leagueId]?.name ?? "League",
    teamId: invite.teamId,
    teamName: invite.teamName ?? "Team",
    leaguePrivacy: leagueMap[invite.leagueId]?.privacy ?? LeaguePrivacy.PRIVATE,
    logoUrl: leagueMap[invite.leagueId]?.logoUrl,
    sport: leagueMap[invite.leagueId]?.sport,
  }));
}

async function fetchLeagueMetaMap(
  api: AxiosInstance,
  leagueIds: string[],
): Promise<
  Record<
    string,
    {
      name: string;
      privacy: LeaguePrivacy;
      logoUrl?: string | null;
      sport?: string | null;
    }
  >
> {
  const entries = await Promise.all(
    leagueIds.map(async (leagueId) => {
      try {
        const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.GET(leagueId));
        return [
          leagueId,
          {
            name: resp.data?.name ?? "League",
            privacy:
              parseLeaguePrivacy(resp.data?.privacy) ?? LeaguePrivacy.PRIVATE,
            logoUrl: resp.data?.logoUrl ?? null,
            sport: resp.data?.sport ?? null,
          },
        ] as const;
      } catch {
        return [
          leagueId,
          {
            name: "League",
            privacy: LeaguePrivacy.PRIVATE,
            logoUrl: null,
            sport: null,
          },
        ] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}
