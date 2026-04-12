export const userNotificationsQueryKey = "user-notifications";

export const teamNotificationInvalidationKeys = [
  ["teams"],
  ["team-members"],
  ["team-membership"],
  ["leagues"],
  ["league-memberships"],
] as const;

export const leagueNotificationInvalidationKeys = [
  ["leagues"],
  ["league-teams"],
  ["league-memberships"],
] as const;

export const teamMatchNotificationInvalidationKeys = [
  ["team-matches"],
] as const;

export const notificationCopy = {
  actionFailedTitle: "Action Failed",
  matchActionFailedTitle: "Match Action Failed",
  inviteAcceptedTitle: "Invite Accepted",
  inviteDeclinedTitle: "Invite Declined",
  matchAcceptedTitle: "Match Accepted",
  matchDeclinedTitle: "Match Declined",
  invitationDeclinedMessage: "The invitation was declined.",
  teamInviteAcceptedMessage: "You have joined the team.",
  leagueInviteAcceptedMessage: "The team has joined the league.",
  teamMatchAcceptedMessage: "The team match invite was accepted.",
  teamMatchDeclinedMessage: "The team match invite was declined.",
  refereeInviteAcceptedMessage: "You accepted the referee invitation.",
  refereeInviteDeclinedMessage: "You declined the referee invitation.",
  missingTeamName: "Team",
  missingLeagueName: "League",
  missingInviterName: "Someone",
  missingHomeTeamName: "Home Team",
  missingAwayTeamName: "Away Team",
} as const;
