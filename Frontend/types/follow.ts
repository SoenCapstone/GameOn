export type FollowSpace = "team" | "league";

export type TeamFollowStatusResponse = {
  following: boolean;
};

export type MyTeamFollowingResponse = {
  teamIds: string[];
};

export type LeagueFollowStatusResponse = {
  following: boolean;
};

export type MyLeagueFollowingResponse = {
  leagueIds: string[];
};
