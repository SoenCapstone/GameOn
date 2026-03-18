import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  RefereeMatchInviteCard,
  RefereeProfile,
  RefInviteResponse,
  TeamMatch,
  TeamMatchInviteCard,
  TeamSummary,
  Venue,
} from "@/features/matches/types";
import {
  filterPendingTeamInvitesForOwner,
  mapTeamsById,
} from "@/features/matches/utils";
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
  const queryClient = useQueryClient();
  return useQuery<(TeamMatch | LeagueMatch)[]>({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      const resp = await api.get<TeamMatch[]>(
        GO_TEAM_SERVICE_ROUTES.MATCHES(teamId),
      );
      const directTeamMatches = resp.data ?? [];

      let leagueMatches: LeagueMatch[] = [];
      try {
        const leaguesResp = await api.get<{ items?: { id: string }[] }>(
          GO_LEAGUE_SERVICE_ROUTES.ALL,
          { params: { size: "100" } },
        );
        const leagueIds = (leaguesResp.data?.items ?? []).map(
          (league) => league.id,
        );

        if (leagueIds.length > 0) {
          const leagueMatchesResults = await Promise.allSettled(
            leagueIds.map(async (leagueId) => {
              const leagueResp = await api.get<LeagueMatch[]>(
                GO_LEAGUE_SERVICE_ROUTES.MATCHES(leagueId),
              );
              return (leagueResp.data ?? []).filter(
                (match) =>
                  match.homeTeamId === teamId || match.awayTeamId === teamId,
              );
            }),
          );

          leagueMatches = leagueMatchesResults.flatMap((result) =>
            result.status === "fulfilled" ? result.value : [],
          );

          const failedCount = leagueMatchesResults.filter(
            (result) => result.status === "rejected",
          ).length;
          if (failedCount > 0) {
            log.warn(
              "Some league match requests failed while aggregating team matches",
              {
                teamId,
                failedCount,
              },
            );
          }
        }
      } catch (err) {
        log.warn("Failed to aggregate league matches for team", {
          teamId,
          err,
        });
      }

      const mergedMatches = [...directTeamMatches, ...leagueMatches];
      const dedupedById = new Map<string, TeamMatch | LeagueMatch>();
      for (const match of mergedMatches) {
        dedupedById.set(match.id, match);
      }

      const previousMatches =
        queryClient.getQueryData<(TeamMatch | LeagueMatch)[]>([
          "team-matches",
          teamId,
        ]) ?? [];
      const previousById = new Map(previousMatches.map((match) => [match.id, match]));

      return Array.from(dedupedById.values()).map((match) => {
        const previousMatch = previousById.get(match.id);
        const fetchedHasScore = match.homeScore != null && match.awayScore != null;
        const previousHasScore =
          previousMatch?.homeScore != null && previousMatch?.awayScore != null;

        if (fetchedHasScore || !previousHasScore) {
          return match;
        }

        if ("matchType" in match) {
          return {
            ...match,
            status: "COMPLETED",
            homeScore: previousMatch.homeScore,
            awayScore: previousMatch.awayScore,
          };
        }

        return {
          ...match,
          homeScore: previousMatch.homeScore,
          awayScore: previousMatch.awayScore,
        };
      });
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
            const resp = await api.get(
              `${GO_TEAM_SERVICE_ROUTES.ALL}/${teamId}`,
            );
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

export function useLeaguesByIds(leagueIds: string[]) {
  const api = useAxiosWithClerk();
  const idsKey = useMemo(
    () =>
      [...new Set(leagueIds.filter(Boolean))]
        .sort((left, right) => left.localeCompare(right))
        .join(","),
    [leagueIds],
  );

  return useQuery<Record<string, { id: string; name: string }>>({
    queryKey: ["league-summary-map", idsKey],
    queryFn: async () => {
      const uniqueIds = idsKey ? idsKey.split(",") : [];
      const entries = await Promise.all(
        uniqueIds.map(async (leagueId) => {
          try {
            const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.GET(leagueId));
            const league = resp.data as { id: string; name?: string };
            return [
              leagueId,
              { id: leagueId, name: league.name ?? "League" },
            ] as const;
          } catch (err) {
            log.warn("Failed to fetch league summary by id", { leagueId, err });
            return [leagueId, { id: leagueId, name: "League" }] as const;
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
    queryKey: [
      "referees",
      queryParams.sport ?? "",
      queryParams.region ?? "",
      queryParams.active ?? true,
      queryParams.matchId ?? "",
    ],
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
      venueId: string;
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
          venueId: payload.venueId,
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
      venueId?: string;
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
          venueId: payload.venueId,
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

export function useTeamVenues(params?: {
  homeTeamId?: string;
  awayTeamId?: string;
  enabled?: boolean;
}) {
  const api = useAxiosWithClerk();
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery<Venue[]>({
    queryKey: [
      "team-venues",
      queryParams.homeTeamId ?? "",
      queryParams.awayTeamId ?? "",
    ],
    queryFn: async () => {
      const resp = await api.get<Venue[]>(GO_TEAM_SERVICE_ROUTES.VENUES, {
        params: queryParams,
      });
      return resp.data ?? [];
    },
    enabled,
    retry: false,
  });
}

export function useLeagueVenues(params?: {
  homeTeamId?: string;
  awayTeamId?: string;
  enabled?: boolean;
}) {
  const api = useAxiosWithClerk();
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery<Venue[]>({
    queryKey: [
      "league-venues",
      queryParams.homeTeamId ?? "",
      queryParams.awayTeamId ?? "",
    ],
    queryFn: async () => {
      const resp = await api.get<Venue[]>(GO_LEAGUE_SERVICE_ROUTES.VENUES, {
        params: queryParams,
      });
      return resp.data ?? [];
    },
    enabled,
    retry: false,
  });
}

export function useTeamVenue(venueId: string, enabled = true) {
  const api = useAxiosWithClerk();
  return useQuery<Venue>({
    queryKey: ["team-venue", venueId],
    queryFn: async () => {
      const resp = await api.get<Venue>(GO_TEAM_SERVICE_ROUTES.VENUE(venueId));
      return resp.data;
    },
    enabled: enabled && Boolean(venueId),
    retry: false,
  });
}

export function useLeagueVenue(venueId: string, enabled = true) {
  const api = useAxiosWithClerk();
  return useQuery<Venue>({
    queryKey: ["league-venue", venueId],
    queryFn: async () => {
      const resp = await api.get<Venue>(
        GO_LEAGUE_SERVICE_ROUTES.VENUE(venueId),
      );
      return resp.data;
    },
    enabled: enabled && Boolean(venueId),
    retry: false,
  });
}

export function useCreateTeamVenue() {
  const api = useAxiosWithClerk();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      homeTeamId?: string;
      awayTeamId?: string;
    }) => {
      const resp = await api.post<Venue>(
        GO_TEAM_SERVICE_ROUTES.VENUES,
        payload,
      );
      return resp.data;
    },
  });
}

export function useCreateLeagueVenue() {
  const api = useAxiosWithClerk();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country?: string;
      region?: string;
      latitude?: number;
      longitude?: number;
      homeTeamId?: string;
      awayTeamId?: string;
    }) => {
      const resp = await api.post<Venue>(
        GO_LEAGUE_SERVICE_ROUTES.VENUES,
        payload,
      );
      return resp.data;
    },
  });
}

export function useCancelLeagueMatch(leagueId: string) {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async ({
      matchId,
      reason,
    }: {
      matchId: string;
      reason?: string;
    }) => {
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
    mutationFn: async ({
      matchId,
      reason,
    }: {
      matchId: string;
      reason?: string;
    }) => {
      const resp = await api.post(
        GO_MATCH_ROUTES.CANCEL(matchId),
        reason ? { reason } : {},
      );
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
      endTime,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      endTime?: string;
    }) => {
      await api.post(GO_LEAGUE_SERVICE_ROUTES.SCORE_MATCH(leagueId, matchId), {
        homeScore,
        awayScore,
        endTime,
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
      endTime,
    }: {
      matchId: string;
      homeScore: number;
      awayScore: number;
      endTime: string;
    }) => {
      await api.post(GO_MATCH_ROUTES.SCORE(matchId), {
        homeScore,
        awayScore,
        endTime,
      });
    },
  });
}

export async function fetchIncomingTeamMatchInvites(
  api: AxiosInstance,
  userId: string,
): Promise<TeamMatchInviteCard[]> {
  const myTeamsResp = await api.get<{ items: TeamSummary[] }>(
    GO_TEAM_SERVICE_ROUTES.ALL,
    {
      params: { my: true, size: 100 },
    },
  );

  const myTeams = myTeamsResp.data?.items ?? [];
  if (myTeams.length === 0) return [];

  const detailEntries = await Promise.all(
    myTeams.map(async (team) => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${team.id}`);
        return resp.data as TeamSummary;
      } catch (err) {
        log.warn("Failed to fetch detailed team for owner check", {
          teamId: team.id,
          err,
        });
        return team;
      }
    }),
  );

  const ownerTeams = detailEntries.filter(
    (team) => team.ownerUserId === userId,
  );
  if (ownerTeams.length === 0) return [];

  const matchesPerTeam = await Promise.all(
    ownerTeams.map(async (team) => {
      const resp = await api.get<TeamMatch[]>(
        GO_TEAM_SERVICE_ROUTES.MATCHES(team.id),
      );
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
    logoUrl: teamMap[match.homeTeamId]?.logoUrl,
    sport: teamMap[match.homeTeamId]?.sport ?? match.sport,
  }));
}

export async function fetchIncomingRefereeInvites(
  api: AxiosInstance,
): Promise<RefereeMatchInviteCard[]> {
  let invites: RefInviteResponse[] = [];
  try {
    const resp = await api.get<RefInviteResponse[]>(
      GO_REFEREE_ROUTES.MY_INVITES,
    );
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
        const matchResp = await api.get<TeamMatch>(
          GO_MATCH_ROUTES.GET(invite.matchId),
        );
        return { invite, match: matchResp.data } as const;
      } catch (err) {
        log.warn("Failed to fetch match for referee invite", {
          inviteId: invite.id,
          err,
        });
        return null;
      }
    }),
  );

  const valid = matches.filter((entry): entry is NonNullable<typeof entry> =>
    Boolean(entry),
  );
  if (valid.length === 0) return [];

  const teamIds = Array.from(
    new Set(
      valid.flatMap((entry) => [
        entry.match.homeTeamId,
        entry.match.awayTeamId,
      ]),
    ),
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
    logoUrl: teamMap[match.homeTeamId]?.logoUrl,
    sport: teamMap[match.homeTeamId]?.sport ?? match.sport,
  }));
}

async function fetchTeamsByIds(api: AxiosInstance, teamIds: string[]) {
  return await Promise.all(
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
}
