import { useEffect, useState } from "react";
import { BoardCard, fetchTeamBoardCards } from "./mock-team-board";

export function useMockTeamBoard(teamId: string, query?: string) {
  const [items, setItems] = useState<BoardCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchTeamBoardCards(teamId, query)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, query]);

  return { items, loading };
}
