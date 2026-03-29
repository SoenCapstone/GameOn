import { useQuery } from "@tanstack/react-query";
import {
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

export function useRefereeName(refereeUserId?: string | null) {
  const api = useAxiosWithClerk();

  return useQuery<string | null>({
    queryKey: ["user-name", refereeUserId ?? ""],
    queryFn: async () => {
      if (!refereeUserId) {
        return null;
      }

      const response = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(refereeUserId));
      const firstName = response.data?.firstname ?? "";
      const lastName = response.data?.lastname ?? "";
      const fullName = `${firstName} ${lastName}`.trim();

      return fullName || null;
    },
    enabled: Boolean(refereeUserId),
    retry: false,
  });
}
