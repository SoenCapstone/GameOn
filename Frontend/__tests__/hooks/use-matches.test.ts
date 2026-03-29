import { useMutation, useQuery } from "@tanstack/react-query";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import {
  fetchIncomingRefereeInvites,
  fetchIncomingTeamMatchInvites,
  useLeagueMatch,
  useLeagueMatches,
  useLeagueTeams,
  useTeamsByIds,
  useLeaguesByIds,
  useReferees,
  useValidateLeagueMatchSchedule,
  useCreateLeagueMatch,
  useValidateTeamMatchSchedule,
  useCreateTeamMatch,
  useTeamVenues,
  useLeagueVenues,
  useTeamVenue,
  useLeagueVenue,
  useCreateTeamVenue,
  useCreateLeagueVenue,
  useCancelLeagueMatch,
  useCancelTeamMatch,
  useUpdateMatchAttendance,
  useMatchMembersByTeam,
  useSubmitLeagueScore,
  useSubmitTeamScore,
  useTeamMatch,
  useTeamMatches,
} from "@/hooks/use-matches";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useMemo: jest.fn((fn) => fn()),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
  GO_LEAGUE_SERVICE_ROUTES: {
    ALL: "/api/v1/leagues",
    GET: (leagueId: string) => `/api/v1/leagues/${leagueId}`,
    MATCHES: (leagueId: string) => `/api/v1/leagues/${leagueId}/matches`,
    SCORE_MATCH: (leagueId: string, matchId: string) =>
      `/api/v1/leagues/${leagueId}/matches/${matchId}/score`,
    TEAMS: (leagueId: string) => `/api/v1/leagues/${leagueId}/teams`,
    VALIDATE_MATCH: (leagueId: string) =>
      `/api/v1/leagues/${leagueId}/matches/validate`,
    CREATE_MATCH: (leagueId: string) => `/api/v1/leagues/${leagueId}/matches`,
    CANCEL_MATCH: (leagueId: string, matchId: string) =>
      `/api/v1/leagues/${leagueId}/matches/${matchId}/cancel`,
    VENUES: "/api/v1/league-venues",
    VENUE: (venueId: string) => `/api/v1/league-venues/${venueId}`,
  },
  GO_TEAM_SERVICE_ROUTES: {
    ALL: "/api/v1/teams",
    MATCHES: (teamId: string) => `/api/v1/teams/${teamId}/matches`,
    VALIDATE_MATCH_INVITE: (teamId: string) =>
      `/api/v1/teams/${teamId}/match-invite/validate`,
    CREATE_MATCH_INVITE: (teamId: string) =>
      `/api/v1/teams/${teamId}/match-invite`,
    VENUES: "/api/v1/team-venues",
    VENUE: (venueId: string) => `/api/v1/team-venues/${venueId}`,
  },
  GO_MATCH_ROUTES: {
    GET: (matchId: string) => `/api/v1/matches/${matchId}`,
    SCORE: (matchId: string) => `/api/v1/matches/${matchId}/score`,
    CANCEL: (matchId: string) => `/api/v1/matches/${matchId}/cancel`,
    ATTENDANCE: (matchId: string) => `/api/v1/matches/${matchId}/attendance`,
    MATCH_MEMBERS_BY_TEAM: (matchId: string, teamId: string) =>
      `/api/v1/matches/${matchId}/team/${teamId}/members`,
    REF_INVITE: (matchId: string) => `/api/v1/matches/${matchId}/ref-invite`,
  },
  GO_REFEREE_ROUTES: {
    ALL: "/api/v1/referees",
    MY_INVITES: "/api/v1/ref-invites",
  },
}));

jest.mock("@/utils/logger", () => ({
  __mockWarn: jest.fn(),
  createScopedLog: jest.fn(() => ({
    warn: jest.requireMock("@/utils/logger").__mockWarn,
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("use-matches", () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAxiosWithClerk as jest.Mock).mockReturnValue(mockApi);
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    (useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it("configures useLeagueMatch and resolves a single match by id", async () => {
    const queryResult = { data: undefined, isLoading: true, error: null };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useLeagueMatch("league-1", "match-2");

    expect(result).toBe(queryResult);
    expect(useQuery).toHaveBeenCalledTimes(1);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
      retry: boolean;
    };

    expect(options.queryKey).toEqual(["league-match", "league-1", "match-2"]);
    expect(options.enabled).toBe(true);
    expect(options.retry).toBe(false);

    mockApi.get.mockResolvedValue({
      data: [
        { id: "match-1", homeTeamId: "h1", awayTeamId: "a1" },
        { id: "match-2", homeTeamId: "h2", awayTeamId: "a2" },
      ],
    });

    const resolved = await options.queryFn();

    expect(mockApi.get).toHaveBeenCalledWith(
      "/api/v1/leagues/league-1/matches",
    );
    expect(resolved).toEqual({
      id: "match-2",
      homeTeamId: "h2",
      awayTeamId: "a2",
    });
  });

  it("disables useLeagueMatch query when inputs are missing or explicitly disabled", () => {
    useLeagueMatch("", "match-2");
    let options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };
    expect(options.enabled).toBe(false);

    useLeagueMatch("league-1", "", true);
    options = (useQuery as jest.Mock).mock.calls[1][0] as {
      enabled: boolean;
    };
    expect(options.enabled).toBe(false);

    useLeagueMatch("league-1", "match-2", false);
    options = (useQuery as jest.Mock).mock.calls[2][0] as {
      enabled: boolean;
    };
    expect(options.enabled).toBe(false);
  });

  it("configures useLeagueMatches and resolves list payload", async () => {
    useLeagueMatches("league-123");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(["league-matches", "league-123"]);
    expect(options.enabled).toBe(true);

    mockApi.get.mockResolvedValueOnce({ data: [{ id: "m1" }] });
    await expect(options.queryFn()).resolves.toEqual([{ id: "m1" }]);
  });

  it("configures useTeamMatch and calls match GET endpoint", async () => {
    useTeamMatch("match-55");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(["team-match", "match-55"]);
    expect(options.enabled).toBe(true);

    mockApi.get.mockResolvedValueOnce({ data: { id: "match-55" } });
    await expect(options.queryFn()).resolves.toEqual({ id: "match-55" });
    expect(mockApi.get).toHaveBeenCalledWith("/api/v1/matches/match-55");
  });

  it("aggregates team + league matches in useTeamMatches and deduplicates by id", async () => {
    useTeamMatches("team-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
      queryKey: unknown[];
    };
    expect(options.queryKey).toEqual(["team-matches", "team-1"]);

    mockApi.get
      .mockResolvedValueOnce({
        data: [{ id: "t1", homeTeamId: "team-1", awayTeamId: "x" }],
      })
      .mockResolvedValueOnce({
        data: { items: [{ id: "league-a" }, { id: "league-b" }] },
      })
      .mockResolvedValueOnce({
        data: [
          { id: "l1", homeTeamId: "team-1", awayTeamId: "z" },
          { id: "shared", homeTeamId: "team-1", awayTeamId: "q" },
        ],
      })
      .mockResolvedValueOnce({
        data: [{ id: "shared", homeTeamId: "team-1", awayTeamId: "q" }],
      });

    const merged = (await options.queryFn()) as { id: string }[];
    expect(
      merged.map((match) => match.id).sort((a, b) => a.localeCompare(b)),
    ).toEqual(["l1", "shared", "t1"]);
  });

  it("falls back to direct team matches when league aggregation fails", async () => {
    useTeamMatches("team-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get
      .mockResolvedValueOnce({
        data: [{ id: "only-team", homeTeamId: "team-1", awayTeamId: "x" }],
      })
      .mockRejectedValueOnce(new Error("league list failed"));

    await expect(options.queryFn()).resolves.toEqual([
      { id: "only-team", homeTeamId: "team-1", awayTeamId: "x" },
    ]);
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalled();
  });

  it("configures useSubmitLeagueScore mutation with expected route and payload", async () => {
    useSubmitLeagueScore("league-x");
    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        homeScore: number;
        awayScore: number;
        endTime?: string;
      }) => Promise<void>;
    };

    mockApi.post.mockResolvedValueOnce({});
    await options.mutationFn({
      matchId: "m-1",
      homeScore: 2,
      awayScore: 0,
      endTime: "2026-03-29T10:30:00.000Z",
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/leagues/league-x/matches/m-1/score",
      {
        homeScore: 2,
        awayScore: 0,
        endTime: "2026-03-29T10:30:00.000Z",
      },
    );
  });

  it("configures useSubmitTeamScore mutation with expected route and payload", async () => {
    useSubmitTeamScore();
    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        homeScore: number;
        awayScore: number;
        endTime: string;
      }) => Promise<void>;
    };

    mockApi.post.mockResolvedValueOnce({});
    await options.mutationFn({
      matchId: "tm-1",
      homeScore: 1,
      awayScore: 1,
      endTime: "2026-03-29T10:30:00.000Z",
    });

    expect(mockApi.post).toHaveBeenCalledWith("/api/v1/matches/tm-1/score", {
      homeScore: 1,
      awayScore: 1,
      endTime: "2026-03-29T10:30:00.000Z",
    });
  });

  it("maps pending incoming team match invites for owner teams", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: { items: [{ id: "team-1", ownerUserId: "u-1", name: "A" }] },
      })
      .mockResolvedValueOnce({
        data: { id: "team-1", ownerUserId: "u-1", name: "A" },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "match-1",
            status: "PENDING_TEAM_ACCEPTANCE",
            createdByUserId: "u-1",
            homeTeamId: "team-9",
            awayTeamId: "team-1",
            startTime: "2026-03-29T10:00:00.000Z",
            sport: "soccer",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: { id: "team-9", name: "Home", sport: "soccer", logoUrl: null },
      })
      .mockResolvedValueOnce({
        data: { id: "team-1", name: "Away", sport: "soccer", logoUrl: null },
      });

    const cards = await fetchIncomingTeamMatchInvites(mockApi as never, "u-1");

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      kind: "team-match",
      matchId: "match-1",
      homeTeamName: "Home",
      awayTeamName: "Away",
    });
  });

  it("maps pending incoming referee invites", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: [
          {
            id: "inv-1",
            matchId: "match-1",
            refereeUserId: "ref-1",
            invitedByUserId: "owner-1",
            status: "PENDING",
            createdAt: "2026-03-29T09:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          id: "match-1",
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          startTime: "2026-03-29T10:00:00.000Z",
          sport: "soccer",
        },
      })
      .mockResolvedValueOnce({
        data: { id: "team-1", name: "Home", sport: "soccer", logoUrl: null },
      })
      .mockResolvedValueOnce({
        data: { id: "team-2", name: "Away", sport: "soccer", logoUrl: null },
      });

    const cards = await fetchIncomingRefereeInvites(mockApi as never);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      kind: "referee-match",
      matchId: "match-1",
      homeTeamName: "Home",
      awayTeamName: "Away",
    });
  });

  it("configures useLeagueTeams with league id", async () => {
    const queryResult = { data: undefined, isLoading: true, error: null };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useLeagueTeams("league-123");

    expect(result).toBe(queryResult);
    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(["league-teams", "league-123"]);
    expect(options.enabled).toBe(true);

    mockApi.get.mockResolvedValueOnce({ data: [{ id: "team-1" }] });
    await expect(options.queryFn()).resolves.toEqual([{ id: "team-1" }]);
  });

  it("disables useLeagueTeams when leagueId is missing", () => {
    useLeagueTeams("");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };

    expect(options.enabled).toBe(false);
  });

  it("configures useTeamsByIds and returns mapped teams", async () => {
    useTeamsByIds(["team-1", "team-2"]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
    };

    expect(options.queryKey).toContain("team-summary-map");
    expect(options.enabled).toBe(true);

    mockApi.get
      .mockResolvedValueOnce({ data: { id: "team-1", name: "Team A" } })
      .mockResolvedValueOnce({ data: { id: "team-2", name: "Team B" } });

    const result = await options.queryFn();
    expect(result).toEqual({
      "team-1": { id: "team-1", name: "Team A" },
      "team-2": { id: "team-2", name: "Team B" },
    });
  });

  it("falls back to minimal team summary on fetch error in useTeamsByIds", async () => {
    useTeamsByIds(["team-1"]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockRejectedValueOnce(new Error("not found"));

    const result = await options.queryFn();
    expect(result).toEqual({
      "team-1": { id: "team-1", name: "Team" },
    });
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalled();
  });

  it("disables useTeamsByIds when no team ids provided", () => {
    useTeamsByIds([]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };

    expect(options.enabled).toBe(false);
  });

  it("configures useLeaguesByIds and returns mapped leagues", async () => {
    useLeaguesByIds(["league-1"]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
    };

    expect(options.queryKey).toContain("league-summary-map");
    expect(options.enabled).toBe(true);

    mockApi.get.mockResolvedValueOnce({
      data: { id: "league-1", name: "League A" },
    });

    const result = await options.queryFn();
    expect(result).toEqual({
      "league-1": { id: "league-1", name: "League A" },
    });
  });

  it("falls back to minimal league summary on fetch error in useLeaguesByIds", async () => {
    useLeaguesByIds(["league-1"]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockRejectedValueOnce(new Error("not found"));

    const result = await options.queryFn();
    expect(result).toEqual({
      "league-1": { id: "league-1", name: "League" },
    });
  });

  it("configures useReferees with query parameters", async () => {
    const queryResult = { data: [], isLoading: false, error: null };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useReferees({ sport: "soccer", region: "CA", active: true });

    expect(result).toBe(queryResult);
    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      queryFn: () => Promise<unknown>;
      enabled: boolean;
    };

    expect(options.queryKey).toContain("referees");
    expect(options.enabled).toBe(true);

    mockApi.get.mockResolvedValueOnce({
      data: [{ id: "ref-1", name: "Referee 1" }],
    });

    const refs = await options.queryFn();
    expect(refs).toHaveLength(1);
    expect(mockApi.get).toHaveBeenCalledWith(
      "/api/v1/referees",
      expect.objectContaining({ params: expect.any(Object) }),
    );
  });

  it("configures useValidateLeagueMatchSchedule mutation", async () => {
    useValidateLeagueMatchSchedule("league-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { isValid: true } });

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      scheduledDate: "2026-04-01",
      startTime: "10:00",
      endTime: "11:30",
      venueId: "venue-1",
      refereeUserId: "ref-1",
    };

    await options.mutationFn(payload);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/leagues/league-1/matches/validate",
      expect.objectContaining({ homeTeamId: "home-1" }),
    );
  });

  it("configures useCreateLeagueMatch mutation", async () => {
    useCreateLeagueMatch("league-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "match-1" } });

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      scheduledDate: "2026-04-01",
      startTime: "10:00",
      endTime: "11:30",
      venueId: "venue-1",
      refereeUserId: "ref-1",
    };

    const result = await options.mutationFn(payload);

    expect(result).toBeDefined();
    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/leagues/league-1/matches",
      expect.any(Object),
    );
  });

  it("configures useValidateTeamMatchSchedule mutation", async () => {
    useValidateTeamMatchSchedule("team-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { isValid: true } });

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      scheduledDate: "2026-04-01",
      startTime: "10:00",
      endTime: "11:30",
      requiresReferee: true,
    };

    await options.mutationFn(payload);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/teams/team-1/match-invite/validate",
      expect.any(Object),
    );
  });

  it("configures useCreateTeamMatch mutation with optional referee invite", async () => {
    useCreateTeamMatch("team-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post
      .mockResolvedValueOnce({ data: { id: "match-1" } })
      .mockResolvedValueOnce({});

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      scheduledDate: "2026-04-01",
      startTime: "10:00",
      endTime: "11:30",
      requiresReferee: true,
      refereeUserId: "ref-1",
    };

    const result = await options.mutationFn(payload);

    expect(result).toHaveProperty("match");
    expect(result).toHaveProperty("refereeInviteSent", true);
  });

  it("handles referee invite failure in useCreateTeamMatch gracefully", async () => {
    useCreateTeamMatch("team-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post
      .mockResolvedValueOnce({ data: { id: "match-1" } })
      .mockRejectedValueOnce(new Error("ref invite failed"));

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      scheduledDate: "2026-04-01",
      startTime: "10:00",
      endTime: "11:30",
      requiresReferee: true,
      refereeUserId: "ref-1",
    };

    const result = await options.mutationFn(payload);

    expect(result).toHaveProperty("match");
    expect(result).toHaveProperty("refereeInviteSent", false);
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalled();
  });

  it("configures useTeamVenues query", async () => {
    const queryResult = { data: [], isLoading: false, error: null };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useTeamVenues({
      homeTeamId: "home-1",
      awayTeamId: "away-1",
    });

    expect(result).toBe(queryResult);
    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toContain("team-venues");
    expect(options.enabled).toBe(true);
  });

  it("configures useLeagueVenues query", async () => {
    const queryResult = { data: [], isLoading: false, error: null };
    (useQuery as jest.Mock).mockReturnValue(queryResult);

    const result = useLeagueVenues({ homeTeamId: "home-1" });

    expect(result).toBe(queryResult);
    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toContain("league-venues");
  });

  it("configures useTeamVenue with venue id", async () => {
    useTeamVenue("venue-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(["team-venue", "venue-1"]);
    expect(options.enabled).toBe(true);
  });

  it("disables useTeamVenue when venue id is missing", () => {
    useTeamVenue("");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };

    expect(options.enabled).toBe(false);
  });

  it("configures useLeagueVenue with venue id", async () => {
    useLeagueVenue("venue-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toEqual(["league-venue", "venue-1"]);
    expect(options.enabled).toBe(true);
  });

  it("configures useCreateTeamVenue mutation", async () => {
    useCreateTeamVenue();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "venue-1" } });

    const payload = {
      name: "City Stadium",
      street: "123 Main St",
      city: "Toronto",
      province: "ON",
      postalCode: "M1A 1A1",
    };

    await options.mutationFn(payload);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/team-venues",
      expect.any(Object),
    );
  });

  it("configures useCreateLeagueVenue mutation", async () => {
    useCreateLeagueVenue();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "venue-1" } });

    const payload = {
      name: "League Venue",
      street: "456 Park Ave",
      city: "Toronto",
      province: "ON",
      postalCode: "M1A 1A1",
    };

    await options.mutationFn(payload);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/league-venues",
      expect.any(Object),
    );
  });

  it("configures useCancelLeagueMatch mutation", async () => {
    useCancelLeagueMatch("league-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        reason?: string;
      }) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "match-1" } });

    await options.mutationFn({ matchId: "match-1", reason: "Conflict" });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/leagues/league-1/matches/match-1/cancel",
      { reason: "Conflict" },
    );
  });

  it("posts empty object to cancel league match without reason", async () => {
    useCancelLeagueMatch("league-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        reason?: string;
      }) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "match-1" } });

    await options.mutationFn({ matchId: "match-1" });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/leagues/league-1/matches/match-1/cancel",
      {},
    );
  });

  it("configures useCancelTeamMatch mutation", async () => {
    useCancelTeamMatch();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        reason?: string;
      }) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "match-1" } });

    await options.mutationFn({ matchId: "match-1", reason: "Weather" });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/matches/match-1/cancel",
      { reason: "Weather" },
    );
  });

  it("configures useUpdateMatchAttendance mutation", async () => {
    useUpdateMatchAttendance();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        attending: "CONFIRMED" | "DECLINED";
      }) => Promise<void>;
    };

    mockApi.post.mockResolvedValueOnce({});

    await options.mutationFn({ matchId: "match-1", attending: "CONFIRMED" });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/matches/match-1/attendance",
      { attending: "CONFIRMED" },
    );
  });

  it("configures useMatchMembersByTeam query", async () => {
    useMatchMembersByTeam("match-1", "team-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryKey: unknown[];
      enabled: boolean;
    };

    expect(options.queryKey).toEqual([
      "match-members-by-team",
      "match-1",
      "team-1",
    ]);
    expect(options.enabled).toBe(true);
  });

  it("disables useMatchMembersByTeam when either id is missing", () => {
    useMatchMembersByTeam("", "team-1");

    let options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };
    expect(options.enabled).toBe(false);

    useMatchMembersByTeam("match-1", "");

    options = (useQuery as jest.Mock).mock.calls[1][0] as { enabled: boolean };
    expect(options.enabled).toBe(false);
  });

  it("executes useLeagueVenues queryFn and returns venue data", async () => {
    useLeagueVenues({ homeTeamId: "h1", awayTeamId: "a1", enabled: true });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({
      data: [{ id: "v1", name: "Venue 1" }],
    });
    const result = await options.queryFn();

    expect(result).toEqual([{ id: "v1", name: "Venue 1" }]);
  });

  it("executes useLeagueVenues queryFn and returns empty array on null data", async () => {
    useLeagueVenues();

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: null });
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("executes useTeamVenue queryFn and returns single venue", async () => {
    useTeamVenue("venue-1", true);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: { id: "v1", name: "Stadium" } });
    const result = await options.queryFn();

    expect(result).toEqual({ id: "v1", name: "Stadium" });
  });

  it("executes useLeagueVenue queryFn and returns single venue", async () => {
    useLeagueVenue("venue-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: { id: "v1", name: "Park" } });
    const result = await options.queryFn();

    expect(result).toEqual({ id: "v1", name: "Park" });
  });

  it("executes useReferees queryFn and returns referee list", async () => {
    useReferees({ sport: "soccer" });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({
      data: [
        { id: "ref-1", name: "Ref 1" },
        { id: "ref-2", name: "Ref 2" },
      ],
    });

    const result = await options.queryFn();

    expect(result).toHaveLength(2);
  });

  it("executes useReferees queryFn and returns empty array on null data", async () => {
    useReferees();

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: null });
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("executes useLeagueTeams queryFn", async () => {
    useLeagueTeams("league-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: [{ id: "team-1" }] });
    const result = await options.queryFn();

    expect(result).toEqual([{ id: "team-1" }]);
  });

  it("executes useLeagueTeams queryFn with null data", async () => {
    useLeagueTeams("league-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: null });
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("executes useMatchMembersByTeam queryFn", async () => {
    useMatchMembersByTeam("match-1", "team-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({
      data: [{ id: "member-1", role: "PLAYER" }],
    });

    const result = await options.queryFn();

    expect(result).toEqual([{ id: "member-1", role: "PLAYER" }]);
  });

  it("executes useMatchMembersByTeam queryFn with null data", async () => {
    useMatchMembersByTeam("match-1", "team-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: null });
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("executes useLeagueMatches queryFn", async () => {
    useLeagueMatches("league-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: [{ id: "m1" }] });
    const result = await options.queryFn();

    expect(result).toEqual([{ id: "m1" }]);
  });

  it("executes useLeagueMatches queryFn with null data", async () => {
    useLeagueMatches("league-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: null });
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("executes useTeamMatch queryFn", async () => {
    useTeamMatch("match-1");

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: { id: "match-1" } });
    const result = await options.queryFn();

    expect(result).toEqual({ id: "match-1" });
  });

  it("executes useLeaguesByIds queryFn", async () => {
    useLeaguesByIds(["league-1", "league-2"]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get
      .mockResolvedValueOnce({ data: { id: "league-1", name: "League 1" } })
      .mockResolvedValueOnce({ data: { id: "league-2", name: "League 2" } });

    const result = await options.queryFn();

    expect(result).toEqual({
      "league-1": { id: "league-1", name: "League 1" },
      "league-2": { id: "league-2", name: "League 2" },
    });
  });

  it("executes useTeamsByIds queryFn with multiple teams", async () => {
    useTeamsByIds(["team-1", "team-2", "team-1"]);

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get
      .mockResolvedValueOnce({ data: { id: "team-1", name: "Team 1" } })
      .mockResolvedValueOnce({ data: { id: "team-2", name: "Team 2" } });

    const result = await options.queryFn();

    expect(result).toHaveProperty("team-1");
    expect(result).toHaveProperty("team-2");
  });

  it("executes useTeamVenues queryFn with null data", async () => {
    useTeamVenues({ homeTeamId: "h1" });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({ data: null });
    const result = await options.queryFn();

    expect(result).toEqual([]);
  });

  it("executes useTeamVenues queryFn with venue data", async () => {
    useTeamVenues({ homeTeamId: "h1", awayTeamId: "a1" });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };

    mockApi.get.mockResolvedValueOnce({
      data: [{ id: "v1", name: "Venue A" }],
    });

    const result = await options.queryFn();

    expect(result).toEqual([{ id: "v1", name: "Venue A" }]);
  });

  it("executes useCreateTeamVenue mutationFn", async () => {
    useCreateTeamVenue();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({
      data: { id: "v1", name: "New Venue" },
    });

    const payload = {
      name: "New Venue",
      street: "123 Main",
      city: "Toronto",
      province: "ON",
      postalCode: "M1A 1A1",
      latitude: 43.6629,
      longitude: -79.3957,
    };

    const result = await options.mutationFn(payload);

    expect(result).toEqual({ id: "v1", name: "New Venue" });
  });

  it("executes useCreateLeagueVenue mutationFn", async () => {
    useCreateLeagueVenue();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "v2", name: "Stadium" } });

    const payload = {
      name: "Stadium",
      street: "456 Park",
      city: "Montreal",
      province: "QC",
      postalCode: "H1A 1A1",
    };

    const result = await options.mutationFn(payload);

    expect(result).toEqual({ id: "v2", name: "Stadium" });
  });

  it("executes useCancelTeamMatch mutationFn without reason", async () => {
    useCancelTeamMatch();

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: {
        matchId: string;
        reason?: string;
      }) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { id: "match-1" } });

    await options.mutationFn({ matchId: "match-1" });

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/matches/match-1/cancel",
      {},
    );
  });

  it("executes useValidateTeamMatchSchedule mutationFn", async () => {
    useValidateTeamMatchSchedule("team-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { isValid: true } });

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      sport: "soccer",
      scheduledDate: "2026-04-05",
      startTime: "14:00",
      endTime: "15:30",
      requiresReferee: false,
      notes: "Friendly match",
    };

    const result = await options.mutationFn(payload);

    expect(result).toBeDefined();
    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/teams/team-1/match-invite/validate",
      expect.objectContaining({ homeTeamId: "home-1" }),
    );
  });

  it("executes useValidateLeagueMatchSchedule mutationFn with optional matchLocation", async () => {
    useValidateLeagueMatchSchedule("league-1");

    const options = (useMutation as jest.Mock).mock.calls[0][0] as {
      mutationFn: (payload: Record<string, unknown>) => Promise<unknown>;
    };

    mockApi.post.mockResolvedValueOnce({ data: { isValid: true } });

    const payload = {
      homeTeamId: "home-1",
      awayTeamId: "away-1",
      scheduledDate: "2026-04-05",
      startTime: "14:00",
      endTime: "15:30",
      venueId: "venue-1",
      matchLocation: "Field A",
      refereeUserId: "ref-1",
    };

    await options.mutationFn(payload);

    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/v1/leagues/league-1/matches/validate",
      expect.objectContaining({ matchLocation: "Field A" }),
    );
  });

  it("disables useReferees when enabled is false", () => {
    useReferees({ enabled: false });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };

    expect(options.enabled).toBe(false);
  });

  it("disables useTeamVenues when enabled is false", () => {
    useTeamVenues({ enabled: false });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };

    expect(options.enabled).toBe(false);
  });

  it("disables useLeagueVenues when enabled is false", () => {
    useLeagueVenues({ enabled: false });

    const options = (useQuery as jest.Mock).mock.calls[0][0] as {
      enabled: boolean;
    };

    expect(options.enabled).toBe(false);
  });

  it("handles error when fetching team details in fetchIncomingTeamMatchInvites", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: { items: [{ id: "team-1", ownerUserId: "u-1", name: "A" }] },
      })
      .mockRejectedValueOnce(new Error("team not found"))
      .mockResolvedValueOnce({
        data: [
          {
            id: "match-1",
            status: "PENDING_TEAM_ACCEPTANCE",
            homeTeamId: "team-9",
            awayTeamId: "team-1",
            startTime: "2026-03-29T10:00:00.000Z",
            sport: "soccer",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: { id: "team-9", name: "Home", sport: "soccer", logoUrl: null },
      })
      .mockResolvedValueOnce({
        data: { id: "team-1", name: "Away", sport: "soccer", logoUrl: null },
      });

    const cards = await fetchIncomingTeamMatchInvites(mockApi as never, "u-1");

    expect(cards).toHaveLength(1);
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalled();
  });

  it("returns empty array from fetchIncomingTeamMatchInvites when no owner teams", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: { items: [{ id: "team-1", ownerUserId: "other-user" }] },
    });

    const cards = await fetchIncomingTeamMatchInvites(mockApi as never, "u-1");

    expect(cards).toEqual([]);
  });

  it("returns empty array from fetchIncomingTeamMatchInvites when no teams", async () => {
    mockApi.get.mockResolvedValueOnce({ data: { items: [] } });

    const cards = await fetchIncomingTeamMatchInvites(mockApi as never, "u-1");

    expect(cards).toEqual([]);
  });

  it("handles error fetching referee invites gracefully", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("endpoint unavailable"));

    const cards = await fetchIncomingRefereeInvites(mockApi as never);

    expect(cards).toEqual([]);
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalled();
  });

  it("returns empty array from fetchIncomingRefereeInvites when no pending invites", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: [
        { id: "inv-1", status: "ACCEPTED" },
        { id: "inv-2", status: "DECLINED" },
      ],
    });

    const cards = await fetchIncomingRefereeInvites(mockApi as never);

    expect(cards).toEqual([]);
  });

  it("handles error fetching match for referee invite", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: [
          {
            id: "inv-1",
            matchId: "match-1",
            status: "PENDING",
          },
        ],
      })
      .mockRejectedValueOnce(new Error("match not found"));

    const cards = await fetchIncomingRefereeInvites(mockApi as never);

    expect(cards).toEqual([]);
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalled();
  });

  it("maps referee invites with team fallbacks when teams cannot be fetched", async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: [
          {
            id: "inv-1",
            matchId: "match-1",
            status: "PENDING",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          id: "match-1",
          homeTeamId: "team-1",
          awayTeamId: "team-2",
          startTime: "2026-03-29T10:00:00.000Z",
          sport: "soccer",
        },
      })
      .mockRejectedValueOnce(new Error("team 1 not found"))
      .mockRejectedValueOnce(new Error("team 2 not found"));

    const cards = await fetchIncomingRefereeInvites(mockApi as never);

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({
      homeTeamName: "Team",
      awayTeamName: "Team",
    });
  });
});
