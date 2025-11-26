import { useEffect, useState } from "react";
import { mockSearchResults, SearchResult } from "@/components/browse/constants";

export function useMockTeam(id?: string) {
  const [team, setTeam] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const currentTeam = mockSearchResults.find(
      (r) => r.id === id && r.type === "team",
    ) as SearchResult | undefined;
    setTeam(currentTeam ?? null);
    setLoading(false);
  }, [id]);

  return { team, loading } as { team: SearchResult | null; loading: boolean };
}
