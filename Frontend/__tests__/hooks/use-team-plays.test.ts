import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useQuery } from "@tanstack/react-query";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { useTeamPlays } from "@/hooks/use-team-plays";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  GO_TEAM_SERVICE_ROUTES: {
    GET_PLAYS: jest.fn(),
  },
  useAxiosWithClerk: jest.fn(),
}));

type TeamPlaysQueryOptions = {
  queryKey: [string, string];
  queryFn: () => Promise<unknown>;
  enabled: boolean;
};

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockGetPlaysRoute = GO_TEAM_SERVICE_ROUTES.GET_PLAYS as jest.MockedFunction<
  typeof GO_TEAM_SERVICE_ROUTES.GET_PLAYS
>;

describe("useTeamPlays", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({} as unknown as ReturnType<typeof useQuery>);
  });

  it("configures query key and enables query when team id exists", () => {
    const mockGet = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useAxiosWithClerk>);

    useTeamPlays("team-1");

    const options = mockUseQuery.mock.calls[0][0] as TeamPlaysQueryOptions;

    expect(options.queryKey).toEqual(["team-plays", "team-1"]);
    expect(options.enabled).toBe(true);
  });

  it("disables query when team id is empty", () => {
    const mockGet = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useAxiosWithClerk>);

    useTeamPlays("");

    const options = mockUseQuery.mock.calls[0][0] as TeamPlaysQueryOptions;

    expect(options.queryKey).toEqual(["team-plays", ""]);
    expect(options.enabled).toBe(false);
  });

  it("builds route through GET_PLAYS and returns response data from queryFn", async () => {
    const responseData = [{ id: "play-1" }];
    const mockGet = jest.fn(async () => ({ data: responseData }));
    mockUseAxiosWithClerk.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useAxiosWithClerk>);
    mockGetPlaysRoute.mockReturnValue("/api/v1/teams/team-1/plays");

    useTeamPlays("team-1");

    const options = mockUseQuery.mock.calls[0][0] as TeamPlaysQueryOptions;
    const result = await options.queryFn();

    expect(mockGetPlaysRoute).toHaveBeenCalledWith("team-1");
    expect(mockGet).toHaveBeenCalledWith("/api/v1/teams/team-1/plays");
    expect(result).toEqual(responseData);
  });
});
