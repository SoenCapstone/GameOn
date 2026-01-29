import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/sign-up/utils";
import {
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { SIGN_UP_SUCCESS_MESSAGE } from "@/components/sign-up/constants";

export const useUpsertUser = () => {
  const api = useAxiosWithClerk();

  return useMutation({
    retry: 1,
    retryDelay: 100,
    mutationFn: async (payload) => {
      return await api.post(GO_USER_SERVICE_ROUTES.CREATE, payload);
    },
    onSuccess: () => toast(SIGN_UP_SUCCESS_MESSAGE),
  });
};
