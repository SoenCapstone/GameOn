export type BoardPostScope = "Members" | "Everyone";

export type BoardPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string | null;
  title: string;
  scope: BoardPostScope;
  content: string;
  createdAt: string;
};

export type CreateBoardPostRequest = {
  spaceId: string;
  title: string;
  scope: BoardPostScope;
  content: string;
};
