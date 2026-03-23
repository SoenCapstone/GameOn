import {
  MatchScheduleValidationResult,
  ScheduleConflictCode,
  Venue,
} from "@/features/matches/types";

export type VenueOption = {
  id: string;
  label: string;
};

const GENERIC_CONFLICT_SUBJECT = "One of these teams";

const SCHEDULE_CONFLICT_MESSAGE_BUILDERS: Record<
  ScheduleConflictCode,
  (subject: string, isPlural: boolean) => string
> = {
  LEAGUE_TEAM_SAME_DAY_CONFLICT: (subject, isPlural) =>
    `${subject} already ${isPlural ? "have" : "has"} a confirmed match on this day. League teams are limited to one match per day.`,
  TEAM_DAILY_LIMIT_EXCEEDED: (subject, isPlural) =>
    `${subject} already ${isPlural ? "have" : "has"} 3 confirmed matches on this day.`,
  TEAM_TIME_SLOT_CONFLICT: (subject, isPlural) =>
    `${subject} already ${isPlural ? "have" : "has"} a confirmed match that overlaps this time or falls within the required 60-minute buffer.`,
};

export const LEAGUE_SAME_DAY_CONFLICT_MESSAGE =
  SCHEDULE_CONFLICT_MESSAGE_BUILDERS.LEAGUE_TEAM_SAME_DAY_CONFLICT(
    GENERIC_CONFLICT_SUBJECT,
    false,
  );
export const TEAM_DAILY_LIMIT_CONFLICT_MESSAGE =
  SCHEDULE_CONFLICT_MESSAGE_BUILDERS.TEAM_DAILY_LIMIT_EXCEEDED(
    GENERIC_CONFLICT_SUBJECT,
    false,
  );
export const TEAM_TIME_CONFLICT_MESSAGE =
  SCHEDULE_CONFLICT_MESSAGE_BUILDERS.TEAM_TIME_SLOT_CONFLICT(
    GENERIC_CONFLICT_SUBJECT,
    false,
  );

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
    ) ??
    "Could not schedule the match."
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
