import { Alert } from "react-native";
import type { AxiosError } from "axios";
import { getScheduleConflictMessage } from "@/utils/schedule";
import { ScheduleConflictCode } from "@/types/matches";

export function getScheduleApiErrorMessage(
  err:
    | AxiosError<{
        message?: string;
        code?: ScheduleConflictCode | null;
        conflictingTeamIds?: string[] | null;
      }>
    | undefined,
  forbiddenMessage: string,
  teamNamesById?: Record<string, string>,
) {
  const status = err?.response?.status;
  const message =
    getScheduleConflictMessage(
      err?.response?.data?.code,
      err?.response?.data?.message ?? "Could not schedule the match.",
      err?.response?.data?.conflictingTeamIds,
      teamNamesById,
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
  teamNamesById?: Record<string, string>,
) {
  const { status, message } = getScheduleApiErrorMessage(
    err as AxiosError<{
      message?: string;
      code?: ScheduleConflictCode | null;
      conflictingTeamIds?: string[] | null;
    }>,
    unauthorizedMessage,
    teamNamesById,
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
