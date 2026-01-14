import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("useTeamSettings");

interface Team {
  readonly id: string;
  readonly name: string;
  readonly sport: string;
  readonly scope: string;
  readonly location: string;
  readonly logoUrl: string;
  readonly privacy: "PUBLIC" | "PRIVATE";
}

interface UpdateTeamPayload {
  readonly name: string;
  readonly sport: string;
  readonly scope: string;
  readonly logoUrl: string;
  readonly location: string;
  readonly privacy: "PUBLIC" | "PRIVATE";
}

export function useTeam(id: string) {
  const api = useAxiosWithClerk();

  return useQuery<Team>({
    queryKey: ["team", id],
    queryFn: async () => {
      try {
        const resp = await api.get(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
        return resp.data;
      } catch (err) {
        log.error("Failed to fetch team:", err);
        throw err;
      }
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateTeam(
  id: string,
  options?: UseMutationOptions<Team, Error, UpdateTeamPayload>,
) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<Team, Error, UpdateTeamPayload>({
    mutationFn: async (payload: UpdateTeamPayload) => {
      log.info("Sending team update payload:", payload);
      const resp = await api.patch(
        `${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`,
        payload,
      );
      return resp.data;
    },
    onSuccess: async (...args) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team", id] }),
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
      ]);
      onSuccess?.(...args);
    },
    ...restOptions,
  });
}

export function useDeleteTeam(
  id: string,
  options?: UseMutationOptions<void, Error, void>,
) {
  const api = useAxiosWithClerk();
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!id) {
        const err = new Error("Team id is required");
        log.error("Delete team failed:", err);
        throw err;
      }
      log.info("Deleting team:", id);
      await api.delete(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
    },
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      onSuccess?.(...args);
    },
    ...restOptions,
  });
}
