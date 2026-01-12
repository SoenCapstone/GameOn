import {
  useQuery,
  useMutation,
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

  return useMutation<Team, Error, UpdateTeamPayload>({
    mutationFn: async (payload: UpdateTeamPayload) => {
      log.info("Sending team update payload:", payload);
      const resp = await api.patch(
        `${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`,
        payload,
      );
      return resp.data;
    },
    ...options,
  });
}

export function useDeleteTeam(
  id: string,
  options?: UseMutationOptions<void, Error, void>,
) {
  const api = useAxiosWithClerk();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      log.info("Deleting team:", id);
      await api.delete(`${GO_TEAM_SERVICE_ROUTES.ALL}/${id}`);
    },
    ...options,
  });
}

