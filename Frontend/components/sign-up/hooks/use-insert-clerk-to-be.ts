import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/sign-up/utils";
import {
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { SIGN_UP_SUCCESS_MESSAGE } from "@/components/sign-up/constants";
import type { UpsertUserMutation } from "@/components/sign-up/models";

export const useUpsertUser = (): UpsertUserMutation => {
  const api = useAxiosWithClerk();

  const mutation = useMutation({
    retry: 1,
    retryDelay: 100,
    mutationFn: async (payload: {
      id: string;
      email: string;
      firstname: string;
      lastname: string;
    }) => {
      await api.post(GO_USER_SERVICE_ROUTES.CREATE, payload);
    },
    onSuccess: () => toast(SIGN_UP_SUCCESS_MESSAGE),
  });

  return {
    mutateAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
};
