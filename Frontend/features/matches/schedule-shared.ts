import { Alert } from "react-native";
import { RelativePathString } from "expo-router";
import { AxiosError } from "axios";
import { Venue } from "@/features/matches/types";
import { getScheduleApiErrorMessage } from "@/utils/schedule-errors";

export type VenueOption = {
  id: string;
  label: string;
};

export function buildVenueOptions(venues: Venue[] | undefined): VenueOption[] {
  return (venues ?? []).map((venue) => ({
    id: venue.id,
    label: `${venue.name} - ${venue.city}`,
  }));
}

export function buildVenueOptionMaps(options: VenueOption[]) {
  return {
    venueLabelToId: Object.fromEntries(
      options.map((venue) => [venue.label, venue.id]),
    ) as Record<string, string>,
    venueIdToLabel: Object.fromEntries(
      options.map((venue) => [venue.id, venue.label]),
    ) as Record<string, string>,
  };
}

export function resolveSelectedVenueLabel(
  venueId: string,
  venueIdToLabel: Record<string, string>,
  newVenueName?: string,
) {
  return (
    (venueId ? venueIdToLabel[venueId] : undefined) ??
    (newVenueName ? `${newVenueName} - New` : "")
  );
}

export function parseDraftDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

export function navigateToMatchesTab(
  replace: (value: {
    pathname: RelativePathString;
    params: { tab: "matches" };
  }) => void,
  pathname: RelativePathString,
) {
  replace({ pathname, params: { tab: "matches" } });
}

export function showScheduleSubmitError(
  err: unknown,
  unauthorizedMessage: string,
  onRetry: () => void,
) {
  const { status, message } = getScheduleApiErrorMessage(
    err as AxiosError<{ message?: string }>,
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
