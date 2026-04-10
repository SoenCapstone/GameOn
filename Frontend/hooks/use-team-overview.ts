import { useQuery } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";
import {
  useAxiosWithClerk,
  GO_TEAM_SERVICE_ROUTES,
} from "@/hooks/use-axios-clerk";
import { teamDetailQueryOptions } from "@/hooks/use-team-detail";
import { fetchTeamMembers } from "@/utils/team-members";
import type { TeamMatch } from "@/types/matches";

const log = createScopedLog("Team Overview");

const OVERVIEW_QUERY_KEY = (teamId: string) => ["team-overview", teamId];

export type TeamOverviewResponse = {
  seasonLabel?: string;
  record?: string;
  tiles: {
    key: "points" | "matches" | "streak" | "minutes";
    label: string;
    value?: number | string;
  }[];
  rosterCounts: {
    owner?: number;
    manager?: number;
    players?: number;
    total?: number;
  };
  performance: {
    off?: number;
    def?: number;
    dis?: number;
    inf?: number;
  };
};

function computeRecord(matches: TeamMatch[], teamId: string): string {
  let wins = 0, losses = 0, draws = 0;

  for (const match of matches) {
    if (match.status !== "COMPLETED") continue;
    if (match.homeScore == null || match.awayScore == null) continue;

    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const oppScore = isHome ? match.awayScore : match.homeScore;

    if (teamScore > oppScore) wins++;
    else if (teamScore < oppScore) losses++;
    else draws++;
  }

  const parts = [`${wins}W`, `${losses}L`];
  if (draws > 0) parts.push(`${draws}D`);
  return parts.join(" - ");
}

function getDefaultTiles(): TeamOverviewResponse {
  return {
    seasonLabel: `Season ${new Date().getFullYear()}`,
    tiles: [
      { key: "points", label: "🏆 Points" },
      { key: "matches", label: "📅 Matches" },
      { key: "streak", label: "🔥 Streak" },
      { key: "minutes", label: "⏱ Minutes" },
    ],
    rosterCounts: {},
    performance: {},
  };
}

export function useTeamOverview(teamId: string) {
  const api = useAxiosWithClerk();

  const { data: teamDetail } = useQuery(teamDetailQueryOptions(api, teamId));

  const { data: members } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => fetchTeamMembers(teamId, api),
    enabled: Boolean(teamId),
    retry: false,
  });

  // Fetch matches to compute the win/loss/draw record
  const { data: matches } = useQuery<TeamMatch[]>({
    queryKey: ["team-matches", teamId],
    queryFn: async () => {
      const resp = await api.get<TeamMatch[]>(GO_TEAM_SERVICE_ROUTES.MATCHES(teamId));
      return resp.data ?? [];
    },
    enabled: Boolean(teamId),
    retry: false,
  });

  return useQuery<TeamOverviewResponse>({
    queryKey: OVERVIEW_QUERY_KEY(teamId),

    queryFn: async () => {
      log.info("Fetching team overview", { teamId });

      const data = getDefaultTiles();
      return {
        ...data,
        record: computeRecord(matches!, teamId),
        rosterCounts: {
          total: members!.length,
          owner: members!.filter((m) => m.role === "OWNER").length,
          manager: members!.filter((m) => m.role === "MANAGER").length,
          players: members!.filter((m) => m.role === "PLAYER").length,
        },
        tiles: data.tiles.map((tile) => {
          if (tile.key === "matches") {
            return { ...tile, value: teamDetail?.totalMatches ?? undefined };
          }
          if (tile.key === "minutes") {
            return { ...tile, value: teamDetail?.minutesPlayed ?? undefined };
          }
          if (tile.key === "points") {
            return { ...tile, value: teamDetail?.totalPoints ?? undefined };
          }
          if (tile.key === "streak") {
            return { ...tile, value: teamDetail?.winStreak ?? undefined };
          }
          return tile;
        }),
        performance: (() => {
          const totalMatches = Math.max(1, teamDetail?.totalMatches ?? 1);
          const avgShots = (teamDetail?.totalShotsOnTarget ?? 0) / totalMatches;
          const avgFouls = (teamDetail?.totalFouls ?? 0) / totalMatches;
          const totalGoalsConceded = matches!
            .filter((m) => m.status === "COMPLETED" && m.homeScore != null && m.awayScore != null)
            .reduce((sum, m) => {
              const conceded = m.homeTeamId === teamId ? m.awayScore! : m.homeScore!;
              return sum + conceded;
            }, 0);
          const avgGoalsConceded = totalGoalsConceded / totalMatches;
          return {
            off: Math.min(100, Math.round(avgShots * 20)),
            def: Math.max(0, Math.round(100 - avgGoalsConceded * 20)),
            dis: Math.max(0, Math.round(100 - avgFouls * 5)),
            inf: Math.round(avgFouls),
          };
        })(),
      };
    },

    enabled: Boolean(teamId) && teamDetail !== undefined && members !== undefined && matches !== undefined,
    retry: false,
  });
}
