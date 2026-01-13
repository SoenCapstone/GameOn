import { PropsWithChildren } from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGetTeamMembers } from "@/hooks/use-get-team-members/use-get-team-members";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { fetchTeamMembers } from "@/hooks/use-get-team-members/utils";

jest.mock("@/hooks/use-axios-clerk", () => ({
  useAxiosWithClerk: jest.fn(),
}));

jest.mock("@/hooks/use-get-team-members/utils", () => ({
  fetchTeamMembers: jest.fn(),
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedFetchTeamMembers = fetchTeamMembers as jest.MockedFunction<
  typeof fetchTeamMembers
>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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

  it("calls fetchTeamMembers with teamId and clerk axios client and returns data", async () => {
    const teamId = "team-123";
    const api = { get: jest.fn() } as any;

    mockedUseAxiosWithClerk.mockReturnValue(api);

    const members = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ] as any;

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
    const api = {} as any;

    mockedUseAxiosWithClerk.mockReturnValue(api);

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
    const api = {} as any;

    mockedUseAxiosWithClerk.mockReturnValue(api);
    mockedFetchTeamMembers.mockResolvedValue([] as any);

    const { result } = renderHook(() => useGetTeamMembers(teamId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedFetchTeamMembers).toHaveBeenCalledWith(teamId, api);
  });
});
