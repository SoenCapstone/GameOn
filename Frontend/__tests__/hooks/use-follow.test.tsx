import {
  renderHook,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import type { JwtPayload } from "@clerk/types";
import { useFollow } from "@/hooks/use-follow";
import { useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { useAuth } from "@clerk/clerk-expo";

jest.mock("@/hooks/use-axios-clerk", () => ({
  ...jest.requireActual<typeof import("@/hooks/use-axios-clerk")>(
    "@/hooks/use-axios-clerk",
  ),
  useAxiosWithClerk: jest.fn(),
}));

jest.mock("@clerk/clerk-expo", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  createScopedLog: () => ({
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

const mockedUseAxiosWithClerk = useAxiosWithClerk as jest.MockedFunction<
  typeof useAxiosWithClerk
>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

/** Axios subset used by `useFollow`; cast when registering with the hook mock. */
interface FollowTestAxios {
  get: jest.Mock<Promise<{ data: { following: boolean } }>, [url: string]>;
  post: jest.Mock<Promise<{ status: number }>, [url: string]>;
  delete: jest.Mock<Promise<{ status: number }>, [url: string]>;
}

interface StringFirstArgMock {
  readonly mock: { readonly calls: ReadonlyArray<readonly unknown[]> };
}

function firstCallUrl(mock: StringFirstArgMock): string {
  const url = mock.mock.calls.at(0)?.at(0);
  if (typeof url !== "string") {
    throw new Error("Expected mock to be called with a string URL");
  }
  return url;
}

function signedInAuth(userId: string): ReturnType<typeof useAuth> {
  return {
    userId,
    isLoaded: true,
    isSignedIn: true,
    sessionId: "s1",
    sessionClaims: {} as JwtPayload,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: jest.fn(),
    signOut: jest.fn(),
    getToken: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>;
}

function signedOutAuth(): ReturnType<typeof useAuth> {
  return {
    userId: null,
    isLoaded: true,
    isSignedIn: false,
    sessionId: null,
    sessionClaims: {} as JwtPayload,
    actor: null,
    orgId: null,
    orgRole: null,
    orgSlug: null,
    has: jest.fn(),
    signOut: jest.fn(),
    getToken: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>;
}

let queryClient: QueryClient;

function createWrapper() {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useFollow", () => {
  let mockApi: FollowTestAxios;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };
    mockedUseAxiosWithClerk.mockReturnValue(mockApi as unknown as AxiosInstance);
    mockedUseAuth.mockReturnValue(signedInAuth("user-1"));
    mockApi.get.mockResolvedValue({ data: { following: false } });
    mockApi.post.mockResolvedValue({ status: 204 });
    mockApi.delete.mockResolvedValue({ status: 204 });
  });

  afterEach(async () => {
    cleanup();
    queryClient?.clear();
  });

  it("does not fetch status when id is empty", async () => {
    const { result } = renderHook(() => useFollow("team", ""), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isStatusLoading).toBe(false);
    });

    expect(mockApi.get).not.toHaveBeenCalled();
    expect(result.current.following).toBe(false);
  });

  it("does not fetch status when userId is missing", async () => {
    mockedUseAuth.mockReturnValue(signedOutAuth());

    const { result } = renderHook(() => useFollow("team", "team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isStatusLoading).toBe(false);
    });

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("loads team follow status when enabled", async () => {
    mockApi.get.mockResolvedValue({ data: { following: true } });

    const { result } = renderHook(() => useFollow("team", "team-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isStatusLoading).toBe(false);
    });

    expect(result.current.following).toBe(true);
    expect(mockApi.get).toHaveBeenCalled();
  });

  it("follow calls POST on follow URL", async () => {
    const { result } = renderHook(() => useFollow("league", "league-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isStatusLoading).toBe(false);
    });

    await act(async () => {
      await result.current.follow();
    });

    expect(mockApi.post).toHaveBeenCalled();
    const postUrl = firstCallUrl(mockApi.post);
    expect(postUrl).toContain("league-1");
    expect(postUrl).toContain("follow");
  });

  it("unfollow calls DELETE on follow URL", async () => {
    mockApi.get.mockResolvedValue({ data: { following: true } });

    const { result } = renderHook(() => useFollow("team", "team-9"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.following).toBe(true);
    });

    await act(async () => {
      await result.current.unfollow();
    });

    expect(mockApi.delete).toHaveBeenCalled();
    const deleteUrl = firstCallUrl(mockApi.delete);
    expect(deleteUrl).toContain("team-9");
    expect(deleteUrl).toContain("follow");
  });
});
