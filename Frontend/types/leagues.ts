export type LeagueSummaryResponse = {
  id: string;
  name: string;
  sport: string;
  slug: string;
  logoUrl?: string | null;
  region?: string | null;
  level?: string | null;
  privacy?: string | null;
  seasonCount?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type LeagueListResponse = {
  items: LeagueSummaryResponse[];
  totalElements: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type LeagueInviteResponse = {
  id: string;
  leagueId: string;
  teamId: string;
  status?: string | null;
};

export enum LeaguePrivacy {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export type LeagueInviteCard = {
  kind: "league";
  id: string;
  leagueId: string;
  leagueName: string;
  teamId: string;
  teamName: string;
  leaguePrivacy: LeaguePrivacy;
  logoUrl?: string | null;
  sport?: string | null;
};

export type LeagueOrganizerInviteCard = {
  kind: "league-organizer";
  id: string;
  leagueId: string;
  leagueName: string;
  inviterName?: string;
  logoUrl?: string | null;
  sport?: string | null;
};