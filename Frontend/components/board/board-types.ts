export type BoardPostScope = "players" | "everyone";

export type BoardPost = {
  id: string;
  spaceId: string;
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
  spaceId: string;
  title: string;
  scope: BoardPostScope;
  content: string;
};
