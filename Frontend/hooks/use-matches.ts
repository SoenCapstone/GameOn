import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_MATCH_ROUTES,
  GO_REFEREE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import {
  LeagueMatch,
  LeagueTeamMembership,
  RefInviteResponse,
  RefereeMatchInviteCard,
  RefereeProfile,
  TeamMatch,
  TeamMatchInviteCard,
  TeamSummary,
} from "@/features/matches/types";
import { filterPendingTeamInvitesForOwner, mapTeamsById } from "@/features/matches/utils";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("Matches");

export function useLeagueTeams(leagueId: string) {
  const api = useAxiosWithClerk();
  return useQuery<LeagueTeamMembership[]>({
    queryKey: ["league-teams", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.TEAMS(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId),
    retry: false,
  });
}

export function useLeagueMatches(leagueId: string) {
  const api = useAxiosWithClerk();
  return useQuery<LeagueMatch[]>({
    queryKey: ["league-matches", leagueId],
    queryFn: async () => {
      const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.MATCHES(leagueId));
      return resp.data ?? [];
    },
    enabled: Boolean(leagueId),
    retry: false,
  });
}

export function useTeamMatches(teamId: string) {
  const api = useAxiosWithClerk();
  return useQuery<TeamMatch[]>({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      const resp = await api.get(GO_TEAM_SERVICE_ROUTES.MATCHES(teamId));
      return resp.data ?? [];
    },
    enabled: Boolean(teamId),
    retry: false,
  });
}

export function useTeamMatch(matchId: string) {
  const api = useAxiosWithClerk();
  return useQuery<TeamMatch>({
    queryKey: ["team-match", matchId],
    queryFn: async () => {
      const resp = await api.get(GO_MATCH_ROUTES.GET(matchId));
      return resp.data;
    },
    enabled: Boolean(matchId),
    retry: false,
  });
}

export function useTeamsByIds(teamIds: string[]) {
  const api = useAxiosWithClerk();
  const idsKey = useMemo(
    () =>
      [...new Set(teamIds.filter(Boolean))]
        .sort((left, right) => left.localeCompare(right))
        .join(","),
    [teamIds],
  );

  return useQuery<Record<string, TeamSummary>>({
    queryKey: ["team-summary-map", idsKey],
    queryFn: async () => {
      const uniqueIds = idsKey ? idsKey.split(",") : [];
      const entries = await Promise.all(
        uniqueIds.map(async (teamId) => {
          try {
            const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`);
            const team = resp.data as TeamSummary;
            return [teamId, team] as const;
          } catch (err) {
            log.warn("Failed to fetch team summary by id", { teamId, err });
            return [teamId, { id: teamId, name: "Team" }] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: idsKey.length > 0,
    retry: false,
  });
}

export function useReferees(params?: {
  sport?: string;
  region?: string;
  active?: boolean;
  matchId?: string;
  enabled?: boolean;
}) {
  const api = useAxiosWithClerk();
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery<RefereeProfile[]>({
    queryKey: ["referees", queryParams.sport ?? "", queryParams.region ?? "", queryParams.active ?? true, queryParams.matchId ?? ""],
    queryFn: async () => {
      const resp = await api.get(GO_REFEREE_ROUTES.ALL, {
        params: queryParams,
      });
      return resp.data ?? [];
    },
    enabled,
    retry: false,
  });
}

export function useCreateLeagueMatch(leagueId: string) {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async (payload: {
      homeTeamId: string;
      awayTeamId: string;
      startTime: string;
      endTime: string;
      matchLocation?: string;
      refereeUserId: string;
    }) => {
      const createResp = await api.post(
        GO_LEAGUE_SERVICE_ROUTES.CREATE_MATCH(leagueId),
        {
          homeTeamId: payload.homeTeamId,
          awayTeamId: payload.awayTeamId,
          startTime: payload.startTime,
          endTime: payload.endTime,
          matchLocation: payload.matchLocation,
          requiresReferee: true,
          refereeUserId: payload.refereeUserId,
        },
      );

      return createResp.data as LeagueMatch;
    },
  });
}

export function useCreateTeamMatch(teamId: string) {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async (payload: {
      homeTeamId: string;
      awayTeamId: string;
      sport?: string;
      startTime: string;
      endTime: string;
      matchRegion?: string;
      requiresReferee: boolean;
      notes?: string;
      refereeUserId?: string;
    }) => {
      const createResp = await api.post(
        GO_TEAM_SERVICE_ROUTES.CREATE_MATCH_INVITE(teamId),
        {
          homeTeamId: payload.homeTeamId,
          awayTeamId: payload.awayTeamId,
          sport: payload.sport,
          startTime: payload.startTime,
          endTime: payload.endTime,
          matchRegion: payload.matchRegion,
          requiresReferee: payload.requiresReferee,
          notes: payload.notes,
        },
      );

      const created = createResp.data as TeamMatch;
      let refereeInviteSent = false;

      if (payload.requiresReferee && payload.refereeUserId) {
        try {
          await api.post(GO_MATCH_ROUTES.REF_INVITE(created.id), {
            refereeUserId: payload.refereeUserId,
          });
          refereeInviteSent = true;
        } catch (err) {
          // Keep match creation successful even if referee invite fails.
          log.warn("Referee invite failed after team match creation", err);
        }
      }

      return { match: created, refereeInviteSent };
    },
  });
}

export function useCancelLeagueMatch(leagueId: string) {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async ({ matchId, reason }: { matchId: string; reason?: string }) => {
      const resp = await api.post(
        GO_LEAGUE_SERVICE_ROUTES.CANCEL_MATCH(leagueId, matchId),
        reason ? { reason } : {},
      );
      return resp.data as LeagueMatch;
    },
  });
}

export function useCancelTeamMatch() {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async ({ matchId, reason }: { matchId: string; reason?: string }) => {
      const resp = await api.post(GO_MATCH_ROUTES.CANCEL(matchId), reason ? { reason } : {});
      return resp.data as TeamMatch;
    },
  });
}

export function useSubmitLeagueScore(leagueId: string) {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) => {
      await api.post(GO_LEAGUE_SERVICE_ROUTES.SCORE_MATCH(leagueId, matchId), {
        homeScore,
        awayScore,
      });
    },
  });
}

export function useSubmitTeamScore() {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async ({
      matchId,
      homeScore,
      awayScore,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
    }) => {
      await api.post(GO_MATCH_ROUTES.SCORE(matchId), {
        homeScore,
        awayScore,
      });
    },
  });
}

export async function fetchIncomingTeamMatchInvites(
  api: AxiosInstance,
  userId: string,
): Promise<TeamMatchInviteCard[]> {
  const myTeamsResp = await api.get<{ items: TeamSummary[] }>(GO_TEAM_SERVICE_ROUTES.ALL, {
    params: { my: true, size: 100 },
  });

  const myTeams = myTeamsResp.data?.items ?? [];
  if (myTeams.length === 0) return [];

  const detailEntries = await Promise.all(
    myTeams.map(async (team) => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${team.id}`);
        return resp.data as TeamSummary;
      } catch (err) {
        log.warn("Failed to fetch detailed team for owner check", { teamId: team.id, err });
        return team;
      }
    }),
  );

  const ownerTeams = detailEntries.filter((team) => team.ownerUserId === userId);
  if (ownerTeams.length === 0) return [];

  const matchesPerTeam = await Promise.all(
    ownerTeams.map(async (team) => {
      const resp = await api.get<TeamMatch[]>(GO_TEAM_SERVICE_ROUTES.MATCHES(team.id));
      return filterPendingTeamInvitesForOwner(resp.data ?? [], team.id);
    }),
  );

  const uniqueMatches = new Map<string, TeamMatch>();
  for (const list of matchesPerTeam) {
    for (const match of list) {
      uniqueMatches.set(match.id, match);
    }
  }

  if (uniqueMatches.size === 0) return [];

  const teamIds = Array.from(
    new Set(
      Array.from(uniqueMatches.values()).flatMap((match) => [
        match.homeTeamId,
        match.awayTeamId,
      ]),
    ),
  );

  const teams = await fetchTeamsByIds(api, teamIds);
  const teamMap = mapTeamsById(teams);

  return Array.from(uniqueMatches.values()).map((match) => ({
    kind: "team-match",
    id: `team-match-${match.id}`,
    matchId: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeTeamName: teamMap[match.homeTeamId]?.name ?? "Home Team",
    awayTeamName: teamMap[match.awayTeamId]?.name ?? "Away Team",
    startTime: match.startTime,
  }));
}

export async function fetchIncomingRefereeInvites(
  api: AxiosInstance,
): Promise<RefereeMatchInviteCard[]> {
  let invites: RefInviteResponse[] = [];
  try {
    const resp = await api.get<RefInviteResponse[]>(GO_REFEREE_ROUTES.MY_INVITES);
    invites = (resp.data ?? []).filter((invite) => invite.status === "PENDING");
  } catch (err) {
    // Endpoint may be unavailable on older backend builds; don't fail Home updates.
    log.warn("Failed to fetch referee invites", err);
    return [];
  }

  if (invites.length === 0) return [];

  const matches = await Promise.all(
    invites.map(async (invite) => {
      try {
        const matchResp = await api.get<TeamMatch>(GO_MATCH_ROUTES.GET(invite.matchId));
        return { invite, match: matchResp.data } as const;
      } catch (err) {
        log.warn("Failed to fetch match for referee invite", { inviteId: invite.id, err });
        return null;
      }
    }),
  );

  const valid = matches.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  if (valid.length === 0) return [];

  const teamIds = Array.from(
    new Set(valid.flatMap((entry) => [entry.match.homeTeamId, entry.match.awayTeamId])),
  );
  const teams = await fetchTeamsByIds(api, teamIds);
  const teamMap = mapTeamsById(teams);

  return valid.map(({ invite, match }) => ({
    kind: "referee-match",
    id: `referee-match-${invite.id}`,
    matchId: invite.matchId,
    homeTeamName: teamMap[match.homeTeamId]?.name ?? "Home Team",
    awayTeamName: teamMap[match.awayTeamId]?.name ?? "Away Team",
    startTime: match.startTime,
  }));
}

async function fetchTeamsByIds(api: AxiosInstance, teamIds: string[]) {
  const entries = await Promise.all(
    teamIds.map(async (teamId) => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`);
        return resp.data as TeamSummary;
      } catch (err) {
        log.warn("Failed to fetch team by id", { teamId, err });
        return { id: teamId, name: "Team" } as TeamSummary;
      }
    }),
  );

  return entries;
}
