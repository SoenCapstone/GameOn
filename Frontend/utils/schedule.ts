import { VenueOption } from "@/types/schedule";
import {
  SCHEDULE_CONFLICT_MESSAGE_BUILDERS,
  SCHEDULE_CONFLICT_MESSAGES,
} from "@/constants/schedule";
export {
  LEAGUE_SAME_DAY_CONFLICT_MESSAGE,
  TEAM_DAILY_LIMIT_CONFLICT_MESSAGE,
  TEAM_TIME_CONFLICT_MESSAGE,
} from "@/constants/schedule";
import {
  MatchScheduleValidationResult,
  ScheduleConflictCode,
  Venue,
} from "@/types/matches";

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
  return (venueId ? venueIdToLabel[venueId] : undefined) ?? newVenueName ?? "";
}

export function getScheduleConflictMessage(
  code?: ScheduleConflictCode | null,
  fallbackMessage?: string | null,
  conflictingTeamIds?: string[] | null,
  teamNamesById?: Record<string, string>,
) {
  const conflictingTeamsLabel = formatConflictingTeamsLabel(
    conflictingTeamIds,
    teamNamesById,
  );

  if (code) {
    return (
      getSpecificScheduleConflictMessage(code, conflictingTeamsLabel) ??
      SCHEDULE_CONFLICT_MESSAGES[code] ??
      fallbackMessage ??
      null
    );
  }

  return fallbackMessage ?? null;
}

export function getBlockedScheduleValidationMessage(
  result: MatchScheduleValidationResult,
  teamNamesById?: Record<string, string>,
) {
  if (result.allowed) {
    return null;
  }

  return (
    getScheduleConflictMessage(
      result.code ?? undefined,
      result.message,
      result.conflictingTeamIds,
      teamNamesById,
    ) ?? "Could not schedule the match."
  );
}

function formatConflictingTeamsLabel(
  conflictingTeamIds?: string[] | null,
  teamNamesById?: Record<string, string>,
) {
  if (!conflictingTeamIds?.length || !teamNamesById) {
    return null;
  }

  const teamNames = conflictingTeamIds
    .map((teamId) => teamNamesById[teamId] ?? teamId)
    .filter(Boolean);

  if (teamNames.length === 0) {
    return null;
  }
  if (teamNames.length === 1) {
    return teamNames[0];
  }
  if (teamNames.length === 2) {
    return `${teamNames[0]} and ${teamNames[1]}`;
  }
  return `${teamNames.slice(0, -1).join(", ")}, and ${teamNames.at(-1)}`;
}

function getSpecificScheduleConflictMessage(
  code: ScheduleConflictCode,
  conflictingTeamsLabel: string | null,
) {
  if (!conflictingTeamsLabel) {
    return null;
  }

  return SCHEDULE_CONFLICT_MESSAGE_BUILDERS[code](
    conflictingTeamsLabel,
    isPluralLabel(conflictingTeamsLabel),
  );
}

function isPluralLabel(conflictingTeamsLabel: string) {
  return conflictingTeamsLabel.includes(" and ");
}
