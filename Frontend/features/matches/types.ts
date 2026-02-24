export type TeamSummary = {
  id: string;
  name: string;
  sport?: string | null;
  logoUrl?: string | null;
  ownerUserId?: string;
};

export type LeagueTeamMembership = {
  id: string;
  leagueId: string;
  teamId: string;
  joinedAt: string;
};

export type RefereeProfile = {
  userId: string;
  sports: string[];
  allowedRegions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeagueMatch = {
  id: string;
  leagueId: string;
  status: "CONFIRMED" | "CANCELLED";
  homeTeamId: string;
  awayTeamId: string;
  sport: string;
  startTime: string;
  endTime: string;
  matchLocation?: string | null;
  requiresReferee: boolean;
  refereeUserId?: string | null;
  createdByUserId: string;
  cancelledByUserId?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamMatch = {
  id: string;
  matchType: "TEAM_MATCH" | "LEAGUE_MATCH";
  status:
    | "PENDING_TEAM_ACCEPTANCE"
    | "CONFIRMED"
    | "DECLINED"
    | "CANCELLED";
  homeTeamId: string;
  awayTeamId: string;
  sport: string;
  startTime: string;
  endTime: string;
  matchLocation?: string | null;
  requiresReferee: boolean;
  refereeUserId?: string | null;
  notes?: string | null;
  createdByUserId: string;
  cancelledByUserId?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MatchStatusBadge =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type TeamMatchInviteCard = {
  kind: "team-match";
  id: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  startTime: string;
};

export type RefInviteResponse = {
  id: string;
  matchId: string;
  refereeUserId: string;
  invitedByUserId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
  respondedAt?: string | null;
};

export type RefereeMatchInviteCard = {
  kind: "referee-match";
  id: string;
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  startTime: string;
};
