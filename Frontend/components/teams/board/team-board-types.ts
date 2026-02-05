export type BoardPostScope = "players" | "everyone";

export type BoardPost = {
  id: string;
  teamId: string;
  authorId: string;
  authorName: string;
  authorRole?: string | null;
  authorImage?: string | null;
  title: string;
  scope: BoardPostScope;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBoardPostRequest = {
  teamId: string;
  title: string;
  scope: BoardPostScope;
  content: string;
};
