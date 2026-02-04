export type BoardPostType = "general" | "game" | "training" | "other";
export type BoardPostScope = "players" | "everyone";

export type BoardPost = {
  id: string;
  teamId: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  type: BoardPostType;
  scope: BoardPostScope;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBoardPostRequest = {
  teamId: string;
  type: BoardPostType;
  scope: BoardPostScope;
  content: string;
};
