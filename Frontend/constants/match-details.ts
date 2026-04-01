export const MATCH_DETAILS_DEFAULTS = {
  awayTeamName: "Away Team",
  homeTeamName: "Home Team",
  leagueLabel: "League Match",
  teamLabel: "Team Match",
} as const;

export const MATCH_ATTENDANCE_ACTIONS = {
  PLAYER: {
    attending: "DECLINED",
    confirmLabel: "Confirm",
    destructive: true,
    icon: "person.fill.xmark",
    label: "Not Attending",
    message: "Are you sure you won't be attending this match?",
    title: "Opt out",
  },
  REPLACEMENT: {
    attending: "CONFIRMED",
    confirmLabel: "Confirm",
    destructive: false,
    icon: "person.fill.checkmark",
    label: "Attending",
    message: "Are you sure you will be attending this match?",
    title: "Confirm attendance",
  },
} as const;
