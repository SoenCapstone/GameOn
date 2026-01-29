import { useMutation } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-expo";
import type { UserResource } from "@clerk/types";
import { toast } from "@/components/sign-up/utils";
import {
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import {
  SIGN_UP_SUCCESS_MESSAGE,
  SIGN_UP_BACKEND_ERROR_MESSAGE,
} from "@/components/sign-up/constants";

export const useUpsertUser = () => {
  const { user } = useUser();
  const api = useAxiosWithClerk();

  return useMutation({
    retry: 3,
    retryDelay: 400,
    mutationFn: async (payload) => {
      return await api.post(GO_USER_SERVICE_ROUTES.CREATE, payload);
    },
    onSuccess: () => toast(SIGN_UP_SUCCESS_MESSAGE),
    onError: () => signOutClerkAndDisplayErrorToast(user),
  });
};

const signOutClerkAndDisplayErrorToast = async (
  user: UserResource | null | undefined,
) => {
  await user?.delete();
  toast(SIGN_UP_BACKEND_ERROR_MESSAGE);
};
