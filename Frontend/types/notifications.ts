import { LeagueInviteCard } from "@/types/leagues";
import { RefereeMatchInviteCard, TeamMatchInviteCard } from "@/types/matches";

export type TeamInviteResponse = {
  id: string;
  teamId: string;
  invitedByUserId?: string | null;
  status?: string | null;
};

export type NotificationTeamMeta = {
  name: string;
  logoUrl?: string | null;
  sport?: string | null;
};

export type TeamInviteCard = {
  kind: "team";
  id: string;
  teamName: string;
  inviterName?: string;
  teamId: string;
  logoUrl?: string | null;
  sport?: string | null;
};

export type NotificationItem =
  | TeamInviteCard
  | LeagueInviteCard
  | TeamMatchInviteCard
  | RefereeMatchInviteCard;

export type NotificationResponse = "accept" | "decline";

export type NotificationContent = {
  spaceName: string;
  logoUrl?: string | null;
  sport?: string | null;
  body: string;
};

export type InvitationResponsePayload = {
  invitationId: string;
  isAccepted: boolean;
};

export type MatchInvitationResponsePayload = {
  matchId: string;
  isAccepted: boolean;
};
