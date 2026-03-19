import {
  MatchScheduleValidationResult,
  ScheduleConflictCode,
  Venue,
} from "@/features/matches/types";

export type VenueOption = {
  id: string;
  label: string;
};

export const LEAGUE_SAME_DAY_CONFLICT_MESSAGE =
  "One of these teams already has a confirmed match on this day. League teams are limited to one match per day.";
export const TEAM_DAILY_LIMIT_CONFLICT_MESSAGE =
  "One of these teams already has 3 confirmed matches on this day.";
export const TEAM_TIME_CONFLICT_MESSAGE =
  "One of these teams already has a confirmed match that overlaps this time or falls within the required 60-minute buffer.";

const SCHEDULE_CONFLICT_MESSAGES: Record<ScheduleConflictCode, string> = {
  LEAGUE_TEAM_SAME_DAY_CONFLICT: LEAGUE_SAME_DAY_CONFLICT_MESSAGE,
  TEAM_DAILY_LIMIT_EXCEEDED: TEAM_DAILY_LIMIT_CONFLICT_MESSAGE,
  TEAM_TIME_SLOT_CONFLICT: TEAM_TIME_CONFLICT_MESSAGE,
};

export function buildVenueOptions(venues: Venue[] | undefined): VenueOption[] {
  return (venues ?? []).map((venue) => ({
    id: venue.id,
    label: venue.name,
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
  return (venueId ? venueIdToLabel[venueId] : undefined) ?? (newVenueName ?? "");
}

export function getScheduleConflictMessage(
  code?: ScheduleConflictCode | null,
  fallbackMessage?: string | null,
) {
  if (code) {
    return SCHEDULE_CONFLICT_MESSAGES[code] ?? fallbackMessage ?? null;
  }
  return fallbackMessage ?? null;
}

export function getBlockedScheduleValidationMessage(
  result: MatchScheduleValidationResult,
) {
  if (result.allowed) {
    return null;
  }
  return (
    getScheduleConflictMessage(result.code ?? undefined, result.message) ??
    "Could not schedule the match."
  );
}
