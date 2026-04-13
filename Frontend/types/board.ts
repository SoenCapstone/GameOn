export type BoardPostScope = "Members" | "Everyone";

export type TeamPostResponse = {
  id: string;
  teamId: string;
  authorUserId: string;
  authorRole: string;
  title: string;
  body: string;
  scope: "Members" | "Everyone";
  createdAt: string;
};

export type TeamPostListResponse = {
  posts: TeamPostResponse[];
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
};

export type LeaguePostResponse = {
  id: string;
  leagueId: string;
  authorUserId: string;
  title: string;
  body: string;
  scope: "Members" | "Everyone";
  createdAt: string;
};

export type LeaguePostListResponse = {
  items: LeaguePostResponse[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type BoardPost = {
  id: string;
  authorName: string;
  title: string;
  scope: BoardPostScope;
  body: string;
  createdAt: string;
};

export type CreateBoardPostRequest = {
  spaceId: string;
  title: string;
  scope: BoardPostScope;
  body: string;
};
