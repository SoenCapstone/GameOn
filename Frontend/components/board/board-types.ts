export type BoardPostScope = "Members" | "Everyone";

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
