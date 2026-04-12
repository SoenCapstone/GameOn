import type { BoardPost } from "@/types/board";
import type { LeagueMatch, TeamMatch } from "@/types/matches";

export type HomeFeedSpaceType = "team" | "league";

export type HomeFeedSpace = {
  id: string;
  kind: HomeFeedSpaceType;
  name: string;
  logoUrl?: string | null;
  sport?: string | null;
};

export type HomeFeedPostItem = {
  kind: "post";
  id: string;
  createdAt: string;
  space: HomeFeedSpace;
  post: BoardPost;
};

export type HomeFeedMatchItem = {
  kind: "match";
  id: string;
  createdAt: string;
  space: HomeFeedSpace;
  match: TeamMatch | LeagueMatch;
  contextLabel: string;
  homeName: string;
  awayName: string;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  sport?: string | null;
  status: string;
  startTime: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isPast: boolean;
};

export type HomeFeedItem = HomeFeedPostItem | HomeFeedMatchItem;
