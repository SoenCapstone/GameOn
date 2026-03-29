import type { LeagueMatch, TeamMatch, TeamSummary } from "@/types/matches";

export type MatchSpace = "team" | "league";

export type MatchDetailsDisplayMatch = LeagueMatch | TeamMatch;

export type MatchDetailsRouteParams = {
  id?: string;
  space?: MatchSpace;
  spaceId?: string;
  homeName?: string;
  awayName?: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
};

export type MatchTeamSummaryMap = Record<string, TeamSummary>;

export type MatchAttendanceAction = {
  attending: "CONFIRMED" | "DECLINED";
  destructive: boolean;
  icon: "person.fill.checkmark" | "person.fill.xmark";
  label: "Attending" | "Not Attending";
  message: string;
  title: string;
};
