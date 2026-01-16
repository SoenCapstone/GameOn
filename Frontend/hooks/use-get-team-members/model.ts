export type TeamMember = {
  email: string;
  firstname: string;
  id: string;
  lastname: string;
  role?: "OWNER" | "MANAGER" | "PLAYER" | "COACH";
  userId?: string;
};
