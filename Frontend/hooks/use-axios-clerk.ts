import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuth } from "@clerk/clerk-expo";
import { useMemo } from "react";
import { AXIOS_BEARER } from "@/constants/hook-constants";

export const useAxiosWithClerk = () => {
  const { getToken } = useAuth();

  return useMemo(() => {
    const axiosInstance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
    });

    attachAxiosInterceptor(axiosInstance, getToken);
    return axiosInstance;
  }, [getToken]);
};

const attachAxiosInterceptor = (
  axiosInstance: AxiosInstance,
  getToken: () => Promise<string | null>,
) => {
  return axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `${AXIOS_BEARER} ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};

const API = "api";

enum VERSIONING {
  v1 = "v1",
}

enum SERVICE {
  USER = "user",
  TEAMS = "teams",
  LEAGUES = "leagues",
  MESSAGING = "messaging",
  REFEREES = "referees"
}

const buildRoute = (version: string, service: string, path?: string) => {
  const base = `${API}/${version}/${service}`;
  return path ? `${base}/${path}` : base;
};

export const GO_USER_SERVICE_ROUTES = {
  TEST: buildRoute(VERSIONING.v1, SERVICE.USER, "test"),
  CREATE: buildRoute(VERSIONING.v1, SERVICE.USER, "create"),
  ALL: buildRoute(VERSIONING.v1, SERVICE.USER, "getAllUsers"),
  BY_EMAIL: (email: string) => buildRoute(VERSIONING.v1, SERVICE.USER, email),
  BY_ID: (userId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.USER, `id/${userId}`),
};

export const GO_TEAM_SERVICE_ROUTES = {
  ALL: buildRoute(VERSIONING.v1, SERVICE.TEAMS),
  CREATE: buildRoute(VERSIONING.v1, SERVICE.TEAMS, "create"),
  TEAM_LOGO: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/logo`),
  GET_TEAM_MEMBERS: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/members`),

  REMOVE_TEAM_MEMBER: (teamId: string, userId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/delete/${userId}`),

  CREATE_INVITE: buildRoute(VERSIONING.v1, SERVICE.TEAMS, "create-invite"),

  TEAM_INVITES: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `invites/${teamId}`),

  USER_INVITES: buildRoute(VERSIONING.v1, SERVICE.TEAMS, "invites"),

  TEAM_POSTS: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/posts`),
  TEAM_POST: (teamId: string, postId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/posts/${postId}`),
  MATCHES: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/matches`),
  CREATE_MATCH_INVITE: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/matches/create-invite`),


  CREATE_PLAY: (teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.TEAMS, `${teamId}/play-maker`),
};

export const GO_LEAGUE_SERVICE_ROUTES = {
  ALL: buildRoute(VERSIONING.v1, SERVICE.LEAGUES),
  CREATE: buildRoute(VERSIONING.v1, SERVICE.LEAGUES, "create"),
  LEAGUE_LOGO: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/logo`),
  GET: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, leagueId),
  TEAMS: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/teams`),
  REMOVE_TEAM: (leagueId: string, teamId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/teams/${teamId}`),
  INVITES: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/invites`),
  MATCHES: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/matches`),
  CREATE_MATCH: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/matches/create-match`),
  CANCEL_MATCH: (leagueId: string, matchId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/matches/${matchId}/cancel`),
  SCORE_MATCH: (leagueId: string, matchId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/matches/${matchId}/score`),
  ASSIGN_REFEREE: (leagueId: string, matchId: string) =>
    buildRoute(
      VERSIONING.v1,
      SERVICE.LEAGUES,
      `${leagueId}/matches/${matchId}/assign-referee`,
    ),
  LEAGUE_POSTS: (leagueId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/posts`),
  LEAGUE_POST: (leagueId: string, postId: string) =>
    buildRoute(VERSIONING.v1, SERVICE.LEAGUES, `${leagueId}/posts/${postId}`),
};

const leagueInvitesBase = buildRoute(VERSIONING.v1, "league-invites");

export const GO_LEAGUE_INVITE_ROUTES = {
  TEAM_INVITES: (teamId: string) =>
    buildRoute(VERSIONING.v1, "teams", `${teamId}/league-invites`),
  ACCEPT: (inviteId: string) => `${leagueInvitesBase}/${inviteId}/accept`,
  DECLINE: (inviteId: string) => `${leagueInvitesBase}/${inviteId}/decline`,
};

const messagingBase = buildRoute(VERSIONING.v1, SERVICE.MESSAGING);

export const GO_MESSAGING_ROUTES = {
  CONVERSATIONS: `${messagingBase}/conversations`,
  DIRECT_CONVERSATION: `${messagingBase}/conversations/direct`,
  TEAM_CONVERSATIONS: (teamId: string) =>
    `${messagingBase}/teams/${teamId}/conversations`,
  MESSAGES: (conversationId: string) =>
    `${messagingBase}/conversations/${conversationId}/messages`,
};

const invitesBase = buildRoute(VERSIONING.v1, "invites");

export const GO_INVITE_ROUTES = {
  RESPOND: `${invitesBase}/response`,
};

const matchesBase = buildRoute(VERSIONING.v1, "matches");

export const GO_MATCH_ROUTES = {
  GET: (matchId: string) => `${matchesBase}/${matchId}`,
  ACCEPT_TEAM_INVITE: (matchId: string) =>
    `${matchesBase}/${matchId}/team-invite/accept`,
  DECLINE_TEAM_INVITE: (matchId: string) =>
    `${matchesBase}/${matchId}/team-invite/decline`,
  CANCEL: (matchId: string) => `${matchesBase}/${matchId}/cancel`,
  SCORE: (matchId: string) => `${matchesBase}/${matchId}/score`,
  ASSIGN_REFEREE: (matchId: string) => `${matchesBase}/${matchId}/assign-referee`,
  REF_INVITE: (matchId: string) => `${matchesBase}/${matchId}/ref-invite`,
  ACCEPT_REF_INVITE: (matchId: string) =>
    `${matchesBase}/${matchId}/ref-invite/accept`,
  DECLINE_REF_INVITE: (matchId: string) =>
    `${matchesBase}/${matchId}/ref-invite/decline`,
};

export const GO_REFEREE_ROUTES = {
  ALL: buildRoute(VERSIONING.v1, "referees"),
  MY_INVITES: buildRoute(VERSIONING.v1, "ref-invites"),
};
export const GO_REFEREE_SERVICE_ROUTES = {
  STATUS: buildRoute(VERSIONING.v1, SERVICE.REFEREES, "status"),
  REGISTER: buildRoute(VERSIONING.v1, SERVICE.REFEREES, "register"),
  UPDATE_SPORTS: buildRoute(VERSIONING.v1, SERVICE.REFEREES, "sports"),
  UPDATE_REGIONS: buildRoute(VERSIONING.v1, SERVICE.REFEREES, "regions"),
  PROFILE: buildRoute(VERSIONING.v1, SERVICE.REFEREES, "profile"),
};
