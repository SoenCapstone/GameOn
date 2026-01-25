import { useMutation } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-expo";
import type { UserResource } from "@clerk/types";
import { toast } from "@/components/sign-up/utils"; 
import { GO_USER_SERVICE_ROUTES, useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { SIGN_UP_SUCCESS_MESSAGE, SIGN_UP_CLERK_ERROR_MESSAGE, SIGN_UP_BACKEND_ERROR_MESSAGE } from "../constants";

export const useUpsertUser = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const {user} = useUser();
  const api = useAxiosWithClerk();
  
  return useMutation({
    retry: 3,    
    retryDelay: 400,
    mutationFn: async (payload) => {
      VerifyHasLoadedAndIsSignedIn(isLoaded, isSignedIn);
      return await api.post(GO_USER_SERVICE_ROUTES.CREATE, payload);
    },
    onSuccess: () => toast(SIGN_UP_SUCCESS_MESSAGE),
    onError: () =>  signOutClerkAndDisplayErrorToast(user),
  });
}

const VerifyHasLoadedAndIsSignedIn = (isLoaded : boolean, isSignedIn: boolean | undefined) => {
  if (!isLoaded || !isSignedIn) {
        throw new Error(SIGN_UP_CLERK_ERROR_MESSAGE);
      }
}

/* Delete account from clerk to avoid an inconsistent user state */
const signOutClerkAndDisplayErrorToast = async (user: UserResource | null | undefined) => {
  await user?.delete();
  toast(SIGN_UP_BACKEND_ERROR_MESSAGE)
}