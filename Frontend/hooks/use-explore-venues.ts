import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { Venue } from "@/types/matches";
import type { ExploreMatchItem } from "@/types/explore";
import {
  GO_LEAGUE_SERVICE_ROUTES,
  GO_TEAM_SERVICE_ROUTES,
  useAxiosWithClerk,
} from "@/hooks/use-axios-clerk";

export function useExploreVenues(matches: ExploreMatchItem[]) {
  const api = useAxiosWithClerk();

  const queries = useMemo(() => {
    const seen = new Set<string>();
    return matches
      .filter((m) => {
        if (!m.match.venueId || seen.has(m.match.venueId)) return false;
        seen.add(m.match.venueId);
        return true;
      })
      .map((m) => {
        const venueId = m.match.venueId as string;
        return {
          queryKey: [
            m.kind === "league" ? "league-venue" : "team-venue",
            venueId,
          ],
          queryFn: async () => {
            const route =
              m.kind === "league"
                ? GO_LEAGUE_SERVICE_ROUTES.VENUE(venueId)
                : GO_TEAM_SERVICE_ROUTES.VENUE(venueId);
            const resp = await api.get<Venue>(route);
            return resp.data;
          },
          retry: false as const,
        };
      });
  }, [matches, api]);

  const results = useQueries({ queries });

  return useMemo(() => {
    const map = new Map<string, Venue>();
    for (const result of results) {
      if (result.data?.id) {
        map.set(result.data.id, result.data);
      }
    }
    return map;
  }, [results]);
}
