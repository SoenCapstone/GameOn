import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GO_USER_SERVICE_ROUTES, useAxiosWithClerk } from "@/hooks/use-axios-clerk";
import { getMatchSection } from "@/features/matches/utils";
import { useTeamsByIds } from "@/hooks/use-matches";

interface MatchLike {
  readonly homeTeamId: string;
  readonly awayTeamId: string;
  readonly refereeUserId?: string | null;
  readonly startTime: string;
  readonly endTime: string;
  readonly status: string;
}

export function useMatchPresentation(match: MatchLike | undefined) {
  const api = useAxiosWithClerk();

  const teamIds = useMemo(
    () => (match ? [match.homeTeamId, match.awayTeamId] : []),
    [match],
  );
  const teamsQuery = useTeamsByIds(teamIds);

  const homeTeam = teamsQuery.data?.[match?.homeTeamId ?? ""];
  const awayTeam = teamsQuery.data?.[match?.awayTeamId ?? ""];
  const title = homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : "Match Details";

  const section = match
    ? getMatchSection(match.startTime, match.endTime, match.status)
    : "upcoming";
  const isPast = section === "past";

  const refereeNameQuery = useQuery({
    queryKey: ["user-name", match?.refereeUserId ?? ""],
    queryFn: async () => {
      const refereeUserId = match?.refereeUserId;
      if (!refereeUserId) return "No referee assigned";
      const resp = await api.get(GO_USER_SERVICE_ROUTES.BY_ID(refereeUserId));
      const first = resp.data?.firstname ?? "";
      const last = resp.data?.lastname ?? "";
      const full = `${first} ${last}`.trim();
      return full || "No referee assigned";
    },
    enabled: Boolean(match?.refereeUserId),
    retry: false,
  });

  const refereeText = match?.refereeUserId
    ? `Referee: ${refereeNameQuery.data ?? "Loading..."}`
    : "Referee: No referee assigned";

  return { homeTeam, awayTeam, title, isPast, refereeText };
}
