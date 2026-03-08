import React from "react";
import { render } from "@testing-library/react-native";
import * as axios from "axios";

import { AXIOS_BEARER } from "@/constants/hook-constants";
import {
  useAxiosWithClerk,
  GO_USER_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  GO_LEAGUE_SERVICE_ROUTES,
  GO_LEAGUE_INVITE_ROUTES,
  GO_MESSAGING_ROUTES,
  GO_INVITE_ROUTES,
} from "@/hooks/use-axios-clerk";

const mockUseAuth = jest.fn();
jest.mock("@clerk/clerk-expo", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("axios", () => {
  let savedOnFulfilled: unknown = null;
  let savedOnRejected: unknown = null;
  const mockUseLocal = (onFulfilled: unknown, onRejected: unknown) => {
    savedOnFulfilled = onFulfilled;
    savedOnRejected = onRejected;
    return 1;
  };

  const instance = {
    interceptors: {
      request: {
        use: mockUseLocal,
      },
    },
  };

  const create = jest.fn(() => instance);
  const defaultExport = { create };
  return {
    default: defaultExport,
    create,
    __getSavedOnFulfilled: () => savedOnFulfilled,
    __getSavedOnRejected: () => savedOnRejected,
    __esModule: true,
  };
});

function TestComp() {
  useAxiosWithClerk();
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
});

test("attaches interceptor and sets Authorization header when token exists", async () => {
  const getToken = jest.fn().mockResolvedValue("token-123");
  mockUseAuth.mockReturnValue({ getToken });

  render(React.createElement(TestComp));

  const axiosMock = axios as unknown as {
    create: jest.Mock;
    __getSavedOnFulfilled: () => unknown;
    __getSavedOnRejected: () => unknown;
  };
  expect(axiosMock.create).toHaveBeenCalledWith({
    baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  });

  const saved = axiosMock.__getSavedOnFulfilled();
  expect(typeof saved).toBe("function");

  const config: Record<string, unknown> = { headers: {} };
  await (saved as (cfg: Record<string, unknown>) => Promise<void>)(config);

  expect((config.headers as Record<string, unknown>).Authorization).toBe(
    `${AXIOS_BEARER} token-123`,
  );
});

test("attaches interceptor and does not set Authorization when no token", async () => {
  const getToken = jest.fn().mockResolvedValue(null);
  mockUseAuth.mockReturnValue({ getToken });

  render(React.createElement(TestComp));

  const axiosMock = axios as unknown as {
    create: jest.Mock;
    __getSavedOnFulfilled: () => unknown;
    __getSavedOnRejected: () => unknown;
  };
  expect(axiosMock.create).toHaveBeenCalled();

  const saved = axiosMock.__getSavedOnFulfilled();
  const config: Record<string, unknown> = { headers: {} };
  await (saved as (cfg: Record<string, unknown>) => Promise<void>)(config);
  expect(
    (config.headers as Record<string, unknown>).Authorization,
  ).toBeUndefined();
});

test("returns rejected promise when interceptor fails", async () => {
  const getToken = jest.fn().mockResolvedValue("token-123");
  mockUseAuth.mockReturnValue({ getToken });

  render(React.createElement(TestComp));

  const axiosMock = axios as unknown as {
    create: jest.Mock;
    __getSavedOnFulfilled: () => unknown;
    __getSavedOnRejected: () => unknown;
  };
  const savedRejected = axiosMock.__getSavedOnRejected();
  const error = new Error("interceptor error");

  await expect(
    (savedRejected as (err: Error) => Promise<never>)(error),
  ).rejects.toThrow("interceptor error");
});

describe("Route Builders", () => {
  it("builds static routes across services", () => {
    const staticRoutes = [
      [GO_USER_SERVICE_ROUTES.TEST, "api/v1/user/test"],
      [GO_USER_SERVICE_ROUTES.CREATE, "api/v1/user/create"],
      [GO_USER_SERVICE_ROUTES.ALL, "api/v1/user/getAllUsers"],
      [GO_TEAM_SERVICE_ROUTES.ALL, "api/v1/teams"],
      [GO_TEAM_SERVICE_ROUTES.CREATE, "api/v1/teams/create"],
      [GO_TEAM_SERVICE_ROUTES.CREATE_INVITE, "api/v1/teams/create-invite"],
      [GO_TEAM_SERVICE_ROUTES.USER_INVITES, "api/v1/teams/invites"],
      [GO_LEAGUE_SERVICE_ROUTES.ALL, "api/v1/leagues"],
      [GO_LEAGUE_SERVICE_ROUTES.CREATE, "api/v1/leagues/create"],
      [GO_MESSAGING_ROUTES.CONVERSATIONS, "api/v1/messaging/conversations"],
      [
        GO_MESSAGING_ROUTES.DIRECT_CONVERSATION,
        "api/v1/messaging/conversations/direct",
      ],
      [GO_INVITE_ROUTES.RESPOND, "api/v1/invites/response"],
    ];

    staticRoutes.forEach(([actual, expected]) => {
      expect(actual).toBe(expected);
    });
  });

  it("builds parameterized routes across services", () => {
    const teamId = "team-123";
    const userId = "user-456";
    const leagueId = "league-123";
    const conversationId = "conv-123";
    const inviteId = "invite-123";
    const email = "test@example.com";
    const uuid = "550e8400-e29b-41d4-a716-446655440000";

    expect(GO_USER_SERVICE_ROUTES.BY_EMAIL(email)).toBe(`api/v1/user/${email}`);
    expect(GO_USER_SERVICE_ROUTES.BY_EMAIL("test+tag@example.co.uk")).toBe(
      "api/v1/user/test+tag@example.co.uk",
    );
    expect(GO_USER_SERVICE_ROUTES.BY_ID(userId)).toBe(
      `api/v1/user/id/${userId}`,
    );
    expect(GO_USER_SERVICE_ROUTES.BY_ID(uuid)).toBe(`api/v1/user/id/${uuid}`);
    expect(GO_USER_SERVICE_ROUTES.BY_ID("12345")).toBe("api/v1/user/id/12345");

    expect(GO_TEAM_SERVICE_ROUTES.GET_TEAM_MEMBERS(teamId)).toBe(
      `api/v1/teams/${teamId}/members`,
    );
    expect(GO_TEAM_SERVICE_ROUTES.REMOVE_TEAM_MEMBER(teamId, userId)).toBe(
      `api/v1/teams/${teamId}/delete/${userId}`,
    );
    expect(GO_TEAM_SERVICE_ROUTES.TEAM_INVITES(teamId)).toBe(
      `api/v1/teams/invites/${teamId}`,
    );
    expect(GO_TEAM_SERVICE_ROUTES.TEAM_POSTS(teamId)).toBe(
      `api/v1/teams/${teamId}/posts`,
    );
    expect(GO_TEAM_SERVICE_ROUTES.TEAM_POST(teamId, "post-789")).toBe(
      `api/v1/teams/${teamId}/posts/post-789`,
    );

    expect(GO_LEAGUE_SERVICE_ROUTES.GET(leagueId)).toBe(
      `api/v1/leagues/${leagueId}`,
    );
    expect(GO_LEAGUE_SERVICE_ROUTES.TEAMS(leagueId)).toBe(
      `api/v1/leagues/${leagueId}/teams`,
    );
    expect(GO_LEAGUE_SERVICE_ROUTES.REMOVE_TEAM(leagueId, "team-456")).toBe(
      `api/v1/leagues/${leagueId}/teams/team-456`,
    );
    expect(GO_LEAGUE_SERVICE_ROUTES.INVITES(leagueId)).toBe(
      `api/v1/leagues/${leagueId}/invites`,
    );
    expect(GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POSTS(leagueId)).toBe(
      `api/v1/leagues/${leagueId}/posts`,
    );
    expect(GO_LEAGUE_SERVICE_ROUTES.LEAGUE_POST(leagueId, "post-456")).toBe(
      `api/v1/leagues/${leagueId}/posts/post-456`,
    );

    expect(GO_LEAGUE_INVITE_ROUTES.TEAM_INVITES(teamId)).toBe(
      `api/v1/teams/${teamId}/league-invites`,
    );
    expect(GO_LEAGUE_INVITE_ROUTES.ACCEPT(inviteId)).toBe(
      `api/v1/league-invites/${inviteId}/accept`,
    );
    expect(GO_LEAGUE_INVITE_ROUTES.DECLINE(inviteId)).toBe(
      `api/v1/league-invites/${inviteId}/decline`,
    );

    expect(GO_MESSAGING_ROUTES.TEAM_CONVERSATIONS(teamId)).toBe(
      `api/v1/messaging/teams/${teamId}/conversations`,
    );
    expect(GO_MESSAGING_ROUTES.MESSAGES(conversationId)).toBe(
      `api/v1/messaging/conversations/${conversationId}/messages`,
    );
  });

  it("returns same instance when getToken dependency does not change", () => {
    const getToken = jest.fn().mockResolvedValue("token-123");
    mockUseAuth.mockReturnValue({ getToken });

    const { rerender } = render(React.createElement(TestComp));
    const axiosMock = axios as unknown as {
      create: jest.Mock;
      __getSavedOnFulfilled: () => unknown;
      __getSavedOnRejected: () => unknown;
    };
    const callCount1 = axiosMock.create.mock.calls.length;

    rerender(React.createElement(TestComp));
    const callCount2 = axiosMock.create.mock.calls.length;

    expect(callCount1).toBe(callCount2);
  });
});
