import type { AxiosError } from "axios";

export function getScheduleApiErrorMessage(
  err: AxiosError<{ message?: string }> | undefined,
  forbiddenMessage: string,
) {
  const status = err?.response?.status;
  const message =
    err?.response?.data?.message ?? "Could not schedule the match.";

  if (!err?.response)
    return { status: 0, message: "Network error. Please retry." };
  if (status === 403) return { status, message: forbiddenMessage };
  return { status, message };
}
