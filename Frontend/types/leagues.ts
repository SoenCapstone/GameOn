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

