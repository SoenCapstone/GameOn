export type TeamMember = {
  email: string;
  firstname: string;
  id: string;
  joinedAt?: string | null;
  lastname: string;
  role?: "OWNER" | "MANAGER" | "PLAYER" | "COACH";
  userId?: string;
  imageUrl?: string | null;
};
