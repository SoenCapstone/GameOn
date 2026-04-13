import type { QueryKey } from "@tanstack/react-query";
import type { FollowSpace } from "@/types/follow";

export const followQuery = {
  root: "follow",
  status: "status",
  teams: "teams",
  leagues: "leagues",
  me: "me",
} as const;

export const followKey = (space: FollowSpace, id: string): QueryKey => [
  followQuery.root,
  followQuery.status,
  space,
  id,
];

export const followingTeamsKey: QueryKey = [
  followQuery.root,
  followQuery.teams,
  followQuery.me,
];

export const followingLeaguesKey: QueryKey = [
  followQuery.root,
  followQuery.leagues,
  followQuery.me,
];
