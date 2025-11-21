/* Note that this code is used to the test a backend connection  & is not an actual component */

import { Button } from "react-native";
import {
  GO_USER_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";
import { useMutation } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";

const log = createScopedLog("Backend Connection Test");

export const BACKEND_TEST = () => {
  const backendTestMutate = useBackendTestMutate();
  return (
    <Button title="test backend" onPress={() => backendTestMutate.mutate()} />
  );
};

const useBackendTestMutate = () => {
  const api = useAxiosWithClerk();

  return useMutation({
    mutationFn: async () => (await api.post(GO_USER_SERVICE_ROUTES.TEST)).data,
    onSuccess: (data) => log.info(data),
    onError: (error) => log.info(errorToString(error)),
  });
};
