import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useQuery } from "@tanstack/react-query";
import {
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { usePlayDetails } from "@/hooks/use-play-details";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/hooks/use-axios-clerk", () => ({
  GO_TEAM_SERVICE_ROUTES: {
    GET_PLAY: jest.fn(),
  },
  useAxiosWithClerk: jest.fn(),
}));

type PlayDetailsQueryOptions = {
  queryKey: [string, string, string | null];
  queryFn: () => Promise<unknown>;
  enabled: boolean;
};

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockGetPlayRoute = GO_TEAM_SERVICE_ROUTES.GET_PLAY as jest.MockedFunction<
  typeof GO_TEAM_SERVICE_ROUTES.GET_PLAY
>;

describe("usePlayDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue(
      {} as unknown as ReturnType<typeof useQuery>,
    );
  });

  it("configures the query key and enables query when team and play ids exist", () => {
    const mockGet = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useAxiosWithClerk>);

    usePlayDetails("team-1", "play-1");

    const options = mockUseQuery.mock.calls[0][0] as PlayDetailsQueryOptions;

    expect(options.queryKey).toEqual(["play-details", "team-1", "play-1"]);
    expect(options.enabled).toBe(true);
  });

  it("disables query when play id is missing", () => {
    const mockGet = jest.fn();
    mockUseAxiosWithClerk.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useAxiosWithClerk>);

    usePlayDetails("team-1", null);

    const options = mockUseQuery.mock.calls[0][0] as PlayDetailsQueryOptions;

    expect(options.queryKey).toEqual(["play-details", "team-1", null]);
    expect(options.enabled).toBe(false);
  });

  it("builds route through GET_PLAY and returns response data from queryFn", async () => {
    const responseData = [{ id: "item-1" }];
    const mockGet = jest.fn(async () => ({ data: responseData }));
    mockUseAxiosWithClerk.mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useAxiosWithClerk>);
    mockGetPlayRoute.mockReturnValue("/api/v1/teams/team-1/plays/play-1");

    usePlayDetails("team-1", "play-1");

    const options = mockUseQuery.mock.calls[0][0] as PlayDetailsQueryOptions;
    const result = await options.queryFn();

    expect(mockGetPlayRoute).toHaveBeenCalledWith("team-1", "play-1");
    expect(mockGet).toHaveBeenCalledWith("/api/v1/teams/team-1/plays/play-1");
    expect(result).toEqual(responseData);
  });
});
