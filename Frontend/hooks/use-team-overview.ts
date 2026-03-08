import { useQuery } from "@tanstack/react-query";
import { createScopedLog } from "@/utils/logger";

const log = createScopedLog("Team Overview");

const OVERVIEW_QUERY_KEY = (teamId: string) => ["team-overview", teamId];

export type TeamOverviewResponse = {
  seasonLabel?: string;
  record?: string;
  tiles: Array<{
    key: "points" | "matches" | "streak" | "minutes";
    label: string;
    value?: number | string;
  }>;
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

/**
 * MOCK ENDPOINT
 * - behaves like backend (async)
 * - returns contract/shape only
 */
async function fetchTeamOverviewMock(
  teamId: string
): Promise<TeamOverviewResponse> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  return {
    seasonLabel: "Season 2026",

    tiles: [
      { key: "points", label: "Points" },
      { key: "matches", label: "Matches" },
      { key: "streak", label: "Streak" },
      { key: "minutes", label: "Minutes" },
    ],
    rosterCounts: {},
    performance: {},
  };
}

export function useTeamOverview(teamId: string) {
  // FUTURE: uncomment when backend exists
  // const api = useAxiosWithClerk();

  return useQuery<TeamOverviewResponse>({
    queryKey: OVERVIEW_QUERY_KEY(teamId),

    queryFn: async () => {
      log.info("Fetching team overview", { teamId });


      const data = await fetchTeamOverviewMock(teamId);
      return data;

    },

    enabled: Boolean(teamId),
    retry: false,
  });
}