import type { LeagueMatch, TeamMatch, TeamSummary } from "@/types/matches";

export type MatchSpace = "team" | "league";

export type MatchDetailsDisplayMatch = LeagueMatch | TeamMatch;

export type MatchDetailsRouteParams = {
  id?: string;
  space?: MatchSpace;
  spaceId?: string;
  leagueId?: string;
  homeName?: string;
  awayName?: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
};

export type MatchTeamSummaryMap = Record<string, TeamSummary>;

export type MatchMemberAttendanceStatus =
  | "CONFIRMED"
  | "DECLINED"
  | "PENDING";

export type MatchAttendanceAction = {
  attending: "CONFIRMED" | "DECLINED";
  confirmLabel: "Attending" | "Confirm";
  destructive: boolean;
  icon: "person.fill.checkmark" | "person.fill.xmark";
  label: "Attending" | "Not Attending";
  message: string;
  title: string;
};

export type MatchToolbarProps = {
  attendanceAction?: MatchAttendanceAction | null;
  onCancelMatch: () => void;
  onOpenInMaps: () => void;
  onSubmitScore: () => void;
  onUpdateAttendance: () => void;
  showAttendanceInMenu: boolean;
  showCancelInMenu: boolean;
  showMatchScoreInMenu: boolean;
  showMenu: boolean;
};
