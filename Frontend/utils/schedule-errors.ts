import { Alert } from "react-native";
import type { AxiosError } from "axios";
import { getScheduleConflictMessage } from "@/features/matches/schedule-shared";
import { ScheduleConflictCode } from "@/features/matches/types";

export function getScheduleApiErrorMessage(
  err:
    | AxiosError<{ message?: string; code?: ScheduleConflictCode | null }>
    | undefined,
  forbiddenMessage: string,
) {
  const status = err?.response?.status;
  const message =
    getScheduleConflictMessage(
      err?.response?.data?.code,
      err?.response?.data?.message ?? "Could not schedule the match.",
    ) ?? "Could not schedule the match.";

  if (!err?.response)
    return { status: 0, message: "Network error. Please retry." };
  if (status === 403) return { status, message: forbiddenMessage };
  return { status, message };
}

export function showScheduleSubmitError(
  err: unknown,
  unauthorizedMessage: string,
  onRetry: () => void,
) {
  const { status, message } = getScheduleApiErrorMessage(
    err as AxiosError<{
      message?: string;
      code?: ScheduleConflictCode | null;
    }>,
    unauthorizedMessage,
  );
  if (status === 0) {
    Alert.alert("Network error", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Retry", onPress: onRetry },
    ]);
    return;
  }
  Alert.alert("Schedule failed", message);
}
