import { AxiosInstance } from "axios";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { Alert } from "react-native";
import { fetchTeamResults } from "@/utils/search";
import {
  GO_LEAGUE_INVITE_ROUTES,
  GO_LEAGUE_ORGANIZER_INVITE_ROUTES,
  GO_LEAGUE_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { isRunningInExpoGo } from "@/utils/runtime";
import { LeagueTeamMembership } from "@/types/matches";
import {
  LeagueInviteCard,
  LeagueInviteResponse,
  LeagueOrganizerInviteCard,
  LeaguePrivacy,
} from "@/types/leagues";
import { fetchUserNameMap } from "@/utils/notifications";

type ShowActionSheet = ReturnType<
  typeof useActionSheet
>["showActionSheetWithOptions"];

type InviteableTeam = {
  readonly id: string;
  readonly sport?: string | null;
};

function parseLeaguePrivacy(value: unknown): LeaguePrivacy | null {
  return value === LeaguePrivacy.PUBLIC || value === LeaguePrivacy.PRIVATE
    ? value
    : null;
}

function normalizeSport(sport?: string | null) {
  return sport ? sport.trim().toLowerCase() : "";
}

export function buildLeagueTeamIdSet(leagueTeams: LeagueTeamMembership[]) {
  return new Set(leagueTeams.map((team) => team.teamId));
}

export function buildPendingInviteTeamIdSet(invites: LeagueInviteResponse[]) {
  return new Set(
    invites
      .filter((invite) => invite.status === "PENDING")
      .map((invite) => invite.teamId),
  );
}

export function filterAvailableLeagueInviteTeams<T extends InviteableTeam>(
  teams: T[],
  leagueSport: string | null | undefined,
  teamIdSet: Set<string>,
  invitedTeamIds: Set<string>,
  pendingInviteTeamIds: Set<string>,
) {
  const normalizedLeagueSport = normalizeSport(leagueSport);

  return teams.filter(
    (team) =>
      (!normalizedLeagueSport ||
        normalizeSport(team.sport) === normalizedLeagueSport) &&
      !teamIdSet.has(team.id) &&
      !invitedTeamIds.has(team.id) &&
      !pendingInviteTeamIds.has(team.id),
  );
}

export function handleLeagueTeamRemove({
  teamId,
  teamName,
  leagueName,
  onConfirm,
  showActionSheetWithOptions,
}: Readonly<{
  teamId: string;
  teamName: string;
  leagueName?: string | null;
  onConfirm: (teamId: string) => void;
  showActionSheetWithOptions: ShowActionSheet;
}>) {
  const confirmDelete = () => {
    Alert.alert(
      `Remove ${teamName}`,
      `Do you want to remove ${teamName} from ${leagueName ?? "this league"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onConfirm(teamId),
        },
      ],
    );
  };

  if (isRunningInExpoGo) {
    showActionSheetWithOptions(
      {
        options: ["Cancel", "Remove Team"],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
        title: `Remove ${teamName}`,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          confirmDelete();
        }
      },
    );
    return;
  }

  confirmDelete();
}

export function handleLeagueRequestPurchase({
  league,
  amountCents,
  formatAmount,
  runPayment,
  onConfirm,
}: Readonly<{
  league?: {
    name?: string | null;
    sport?: string | null;
    level?: string | null;
    region?: string | null;
    location?: string | null;
    logoUrl?: string | null;
  } | null;
  amountCents: number;
  formatAmount: (amount: number) => string;
  runPayment: (onPaid: () => Promise<void> | void) => void;
  onConfirm: (payload: {
    name: string;
    sport: string;
    level: string;
    region: string;
    location: string;
    logoUrl?: string;
    privacy: "PUBLIC";
  }) => void;
}>) {
  if (!league) return;

  const payload = {
    name: league.name ?? "",
    sport: league.sport ?? "",
    level: league.level ?? "",
    region: league.region ?? "",
    location: league.location ?? "",
    logoUrl: league.logoUrl ?? undefined,
    privacy: "PUBLIC" as const,
  };

  Alert.alert("League Publication Payment", `Amount: ${formatAmount(amountCents)}`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Pay & Continue",
      onPress: () => runPayment(() => onConfirm(payload)),
    },
  ]);
}

export function handleLeagueSetPrivate({
  league,
  onConfirm,
}: Readonly<{
  league?: {
    name?: string | null;
    sport?: string | null;
    level?: string | null;
    region?: string | null;
    location?: string | null;
    logoUrl?: string | null;
  } | null;
  onConfirm: (payload: {
    name: string;
    sport: string;
    level: string;
    region: string;
    location: string;
    logoUrl?: string;
    privacy: "PRIVATE";
  }) => void;
}>) {
  if (!league) return;

  onConfirm({
    name: league.name ?? "",
    sport: league.sport ?? "",
    level: league.level ?? "",
    region: league.region ?? "",
    location: league.location ?? "",
    logoUrl: league.logoUrl ?? undefined,
    privacy: "PRIVATE",
  });
}

export function handleLeagueDelete({
  onConfirm,
}: Readonly<{
  onConfirm: () => void;
}>) {
  Alert.alert(
    "Delete League",
    "Are you sure you want to delete this league? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: onConfirm,
        style: "destructive",
      },
    ],
  );
}


export async function fetchPendingLeagueInvites(
  api: AxiosInstance,
  leagueId: string,
): Promise<LeagueInviteResponse[]> {
  const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.INVITES(leagueId), {
    params: { status: "PENDING" },
  });

  const invites = (resp.data ?? []) as LeagueInviteResponse[];
  return invites.filter((invite) => invite.status === "PENDING");
}

export async function fetchLeagueInvitesWithDetails(
  api: AxiosInstance,
): Promise<LeagueInviteCard[]> {
  const teamResp = await fetchTeamResults(api, "", true);
  const teams = teamResp.items ?? [];

  if (teams.length === 0) return [];

  const leagueInvitesNested = await Promise.all(
    teams.map(async (team) => {
      try {
        const resp = await api.get<LeagueInviteResponse[]>(
          GO_LEAGUE_INVITE_ROUTES.TEAM_INVITES(team.id),
        );

        const pending = (resp.data ?? []).filter(
          (invite) => invite.status === "PENDING",
        );

        return pending.map((invite) => ({
          ...invite,
          teamName: team.name ?? "Team",
        }));
      } catch {
        return [];
      }
    }),
  );

  const flatInvites = leagueInvitesNested.flat();
  if (flatInvites.length === 0) return [];

  const leagueIds = Array.from(new Set(flatInvites.map((i) => i.leagueId)));
  const leagueMap = await fetchLeagueMetaMap(api, leagueIds);

  return flatInvites.map((invite) => ({
    kind: "league" as const,
    id: invite.id,
    leagueId: invite.leagueId,
    leagueName: leagueMap[invite.leagueId]?.name ?? "League",
    teamId: invite.teamId,
    teamName: invite.teamName ?? "Team",
    leaguePrivacy: leagueMap[invite.leagueId]?.privacy ?? LeaguePrivacy.PRIVATE,
    logoUrl: leagueMap[invite.leagueId]?.logoUrl,
    sport: leagueMap[invite.leagueId]?.sport,
  }));
}

export async function fetchOrganizerInvitesWithDetails(
  api: AxiosInstance,
): Promise<LeagueOrganizerInviteCard[]> {
  const resp = await api.get<
    { id: string; leagueId: string; invitedByUserId?: string; status?: string }[]
  >(GO_LEAGUE_ORGANIZER_INVITE_ROUTES.MINE);

  const invites = (resp.data ?? []).filter((i) => i.status === "PENDING");
  if (invites.length === 0) return [];

  const leagueIds = Array.from(new Set(invites.map((i) => i.leagueId)));
  const inviterIds = Array.from(
    new Set(invites.map((i) => i.invitedByUserId).filter(Boolean)),
  ) as string[];

  const [leagueMap, inviterMap] = await Promise.all([
    fetchLeagueMetaMap(api, leagueIds),
    fetchUserNameMap(api, inviterIds),
  ]);

  return invites.map((invite) => ({
    kind: "league-organizer" as const,
    id: invite.id,
    leagueId: invite.leagueId,
    leagueName: leagueMap[invite.leagueId]?.name ?? "League",
    inviterName: invite.invitedByUserId
      ? (inviterMap[invite.invitedByUserId] ?? undefined)
      : undefined,
    logoUrl: leagueMap[invite.leagueId]?.logoUrl,
    sport: leagueMap[invite.leagueId]?.sport,
  }));
}

async function fetchLeagueMetaMap(
  api: AxiosInstance,
  leagueIds: string[],
): Promise<
  Record<
    string,
    {
      name: string;
      privacy: LeaguePrivacy;
      logoUrl?: string | null;
      sport?: string | null;
    }
  >
> {
  const entries = await Promise.all(
    leagueIds.map(async (leagueId) => {
      try {
        const resp = await api.get(GO_LEAGUE_SERVICE_ROUTES.GET(leagueId));
        return [
          leagueId,
          {
            name: resp.data?.name ?? "League",
            privacy:
              parseLeaguePrivacy(resp.data?.privacy) ?? LeaguePrivacy.PRIVATE,
            logoUrl: resp.data?.logoUrl ?? null,
            sport: resp.data?.sport ?? null,
          },
        ] as const;
      } catch {
        return [
          leagueId,
          {
            name: "League",
            privacy: LeaguePrivacy.PRIVATE,
            logoUrl: null,
            sport: null,
          },
        ] as const;
      }
    }),
  );

  return Object.fromEntries(entries);
}