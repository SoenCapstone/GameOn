import { AxiosInstance } from "axios";
import { notificationCopy } from "@/constants/notifications";
import { GO_USER_SERVICE_ROUTES } from "@/hooks/use-axios-clerk";

export async function fetchUserNameMap(api: AxiosInstance, userIds: string[]) {
  const entries = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(userId));
        const first = resp.data?.firstname ?? "";
        const last = resp.data?.lastname ?? "";
        const full = `${first} ${last}`.trim();
        return [
          userId,
          full || resp.data?.email || notificationCopy.missingInviterName,
        ] as const;
      } catch {
        return [userId, notificationCopy.missingInviterName] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}
