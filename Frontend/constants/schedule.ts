import { ScheduleConflictCode } from "@/types/matches";

const GENERIC_CONFLICT_SUBJECT = "One of these teams";

export const SCHEDULE_CONFLICT_MESSAGE_BUILDERS: Record<
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

export const SCHEDULE_CONFLICT_MESSAGES: Record<ScheduleConflictCode, string> = {
  LEAGUE_TEAM_SAME_DAY_CONFLICT: LEAGUE_SAME_DAY_CONFLICT_MESSAGE,
  TEAM_DAILY_LIMIT_EXCEEDED: TEAM_DAILY_LIMIT_CONFLICT_MESSAGE,
  TEAM_TIME_SLOT_CONFLICT: TEAM_TIME_CONFLICT_MESSAGE,
};
