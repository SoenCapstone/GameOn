import { PropsWithChildren } from "react";
import { renderHook, waitFor, cleanup } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { fetchTeamMembers } from "@/hooks/use-get-team-members/utils";
import { AxiosInstance } from "axios";
import { TeamMember } from "@/hooks/use-get-team-members/model";

jest.mock("@/hooks/use-axios-clerk", () => ({
  GO_TEAM_SERVICE_ROUTES: {
    GET_TEAM_MEMBERS: (teamId: string) => `/teams/${teamId}/members`,
  },
  useAxiosWithClerk: jest.fn(),
}));

describe("fetchTeamMembers", () => {
  it("maps members and uses id fallback", async () => {
    const teamId = "team-abc";
    const members = [
      { id: "1", userId: "u1", firstname: "Bob" },
      { id: undefined, userId: "u2", firstname: "Alice" },
    ];
    const api = {
      get: jest.fn().mockResolvedValue({ data: members }),
    } as unknown as AxiosInstance;
    const { fetchTeamMembers } = jest.requireActual(
      "@/hooks/use-get-team-members/utils",
    );
    const result = await fetchTeamMembers(teamId, api);
    expect(api.get).toHaveBeenCalledWith(expect.any(String));
    expect(result).toEqual([
      { id: "1", userId: "u1", firstname: "Bob" },
      { id: "u2", userId: "u2", firstname: "Alice" },
    ]);
  });

  it("returns empty array if data is missing", async () => {
    const teamId = "team-empty";
    const api = {
      get: jest.fn().mockResolvedValue({ data: undefined }),
    } as unknown as AxiosInstance;
    const { fetchTeamMembers } = jest.requireActual(
      "@/hooks/use-get-team-members/utils",
    );
    const result = await fetchTeamMembers(teamId, api);
    expect(result).toEqual([]);
  });

  it("returns empty array if data is empty", async () => {
    const teamId = "team-empty";
    const api = {
      get: jest.fn().mockResolvedValue({ data: [] }),
    } as unknown as AxiosInstance;
    const { fetchTeamMembers } = jest.requireActual(
      "@/hooks/use-get-team-members/utils",
    );
    const result = await fetchTeamMembers(teamId, api);
    expect(result).toEqual([]);
  });
});

jest.mock("@/hooks/use-get-team-members/utils", () => ({
  fetchTeamMembers: jest.fn(),
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedFetchTeamMembers = fetchTeamMembers as jest.MockedFunction<
  typeof fetchTeamMembers
>;

let queryClient: QueryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useGetTeamMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    if (queryClient) {
      queryClient.clear();
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it("calls fetchTeamMembers with teamId and clerk axios client and returns data", async () => {
    const teamId = "team-123";
    const api = { get: jest.fn() } as { get: jest.Mock };

    mockedUseAxiosWithClerk.mockReturnValue(api as unknown as AxiosInstance);

    const members = [
      { id: "1", firstname: "Bob" },
      { id: "2", firstname: "Alice" },
    ] as TeamMember[];

    mockedFetchTeamMembers.mockResolvedValue(members);

    const { result } = renderHook(() => useGetTeamMembers(teamId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedUseAxiosWithClerk).toHaveBeenCalledTimes(2);
    expect(mockedFetchTeamMembers).toHaveBeenCalledTimes(1);
    expect(mockedFetchTeamMembers).toHaveBeenCalledWith(teamId, api);
    expect(result.current.data).toEqual(members);
  });

  it("exposes error when fetchTeamMembers rejects", async () => {
    const teamId = "team-err";
    const api = {} as { [key: string]: unknown };

    mockedUseAxiosWithClerk.mockReturnValue(api as unknown as AxiosInstance);

    const err = new Error("boom");
    mockedFetchTeamMembers.mockRejectedValue(err);

    const { result } = renderHook(() => useGetTeamMembers(teamId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockedFetchTeamMembers).toHaveBeenCalledWith(teamId, api);
    expect(result.current.error).toBe(err);
  });

  it("uses the expected queryKey", async () => {
    const teamId = "team-key";
    const api = {} as { [key: string]: unknown };

    mockedUseAxiosWithClerk.mockReturnValue(api as unknown as AxiosInstance);
    mockedFetchTeamMembers.mockResolvedValue([] as const);

    const { result } = renderHook(() => useGetTeamMembers(teamId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchTeamMembers).toHaveBeenCalledWith(teamId, api);
  });
});
