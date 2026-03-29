import { useMemo } from "react";
import { useRefereeName } from "@/hooks/use-referee-name";
import { useTeamsByIds } from "@/hooks/use-matches";
import { getMatchSection } from "@/utils/matches";

interface MatchLike {
  readonly homeTeamId: string;
  readonly awayTeamId: string;
  readonly refereeUserId?: string | null;
  readonly startTime: string;
  readonly status: string;
}

export function useMatchPresentation(match: MatchLike | undefined) {
  const teamIds = useMemo(
    () => (match ? [match.homeTeamId, match.awayTeamId] : []),
    [match],
  );
  const teamsQuery = useTeamsByIds(teamIds);
  const refereeNameQuery = useRefereeName(match?.refereeUserId);

  const homeTeam = teamsQuery.data?.[match?.homeTeamId ?? ""];
  const awayTeam = teamsQuery.data?.[match?.awayTeamId ?? ""];
  const title =
    homeTeam && awayTeam
      ? `${homeTeam.name} vs ${awayTeam.name}`
      : "Match Details";
  const section = match
    ? getMatchSection(match.startTime, match.status)
    : "upcoming";
  const isPast = section === "past";

  return {
    awayTeam,
    homeTeam,
    isPast,
    refereeName: refereeNameQuery.data ?? undefined,
    title,
  };
}
