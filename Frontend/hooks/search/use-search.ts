import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterPublicSearchResults } from "@/utils/search";
import { useTeamResults } from "@/hooks/search/use-team-results";
import { useLeagueResults } from "@/hooks/search/use-league-results";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";
import type { Modes, SearchValue, SearchResult } from "@/constants/search";

export type UseSearchOptions = {
  readonly member?: boolean;
  readonly public?: boolean;
  readonly scope?: string;
};

export function useSearch(options?: UseSearchOptions): SearchValue {
  const member = options?.member;
  const publicOnly = options?.public === true;
  const log = useMemo(
    () => createScopedLog(options?.scope ?? "Search.useSearch"),
    [options?.scope],
  );

  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [activeMode, setActiveMode] = useState<Modes | undefined>(undefined);

  const lastSearchRef = useRef<{
    id: number;
    query: string;
    resultCount: number;
    mode?: Modes;
  } | null>(null);
  const nextId = useRef(1);

  const teamQuery = useTeamResults(query, member);
  const leagueQuery = useLeagueResults(query, member);

  const combined = useMemo(() => {
    const teamItems = (teamQuery.data ?? []).slice();
    const remoteLeagueItems = (leagueQuery.data ?? []).slice();
    const merged = [...teamItems, ...remoteLeagueItems];
    merged.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return merged;
  }, [teamQuery.data, leagueQuery.data]);

  const results = useMemo(
    () => (publicOnly ? filterPublicSearchResults(combined) : combined),
    [combined, publicOnly],
  );

  const refetch = useCallback(async () => {
    await Promise.all([teamQuery.refetch(), leagueQuery.refetch()]);
  }, [teamQuery, leagueQuery]);

  const isLoading = teamQuery.isLoading || leagueQuery.isLoading;
  const teamError = teamQuery.error ?? null;
  const leagueError = leagueQuery.error ?? null;

  useEffect(() => {
    const pendingMode = lastSearchRef.current?.mode;
    lastSearchRef.current = {
      id: nextId.current++,
      query,
      resultCount: results.length,
      mode: pendingMode,
    };

    let displayedCount = results.length;
    if (lastSearchRef.current?.mode) {
      const mode = lastSearchRef.current.mode;
      const q = (query || "").toLowerCase().trim();
      const modeTypeMap: Record<Modes, SearchResult["type"]> = {
        teams: "team",
        leagues: "league",
        tournaments: "tournament",
      };
      const selectedType = modeTypeMap[mode];
      displayedCount = results
        .filter((r) => r.type === selectedType)
        .filter((r) => {
          if (!q) return true;
          return r.name.toLowerCase().includes(q);
        }).length;
    }

    const payload: Record<string, string | number> = {
      query,
      resultCount: displayedCount,
      tookMs: 0,
    };
    if (lastSearchRef.current?.mode) payload.mode = lastSearchRef.current.mode;
    log.info("search completed", payload);
    lastSearchRef.current = null;
  }, [results, query, log]);

  const markRendered = useCallback(
    (
      renderTookMs: number,
      opts?: {
        mode?: Modes;
        resultCount?: number;
        query?: string;
      },
    ) => {
      const meta = lastSearchRef.current;
      if (!meta && !opts) return;
      const payload: Record<string, string | number> = {
        query: opts?.query ?? meta?.query ?? "",
        resultCount: opts?.resultCount ?? meta?.resultCount ?? 0,
        tookMs: renderTookMs,
      };

      if (opts?.mode) payload.mode = opts.mode;

      log.info("search completed", payload);
      lastSearchRef.current = null;
    },
    [log],
  );

  const notifyModeChange = useCallback(
    (mode: Modes, resultCount: number) => {
      if (lastSearchRef.current) {
        lastSearchRef.current.mode = mode;
        lastSearchRef.current.resultCount = resultCount;
      } else {
        lastSearchRef.current = {
          id: nextId.current++,
          query,
          resultCount,
          mode,
        };
      }
    },
    [query],
  );

  return useMemo(
    () => ({
      query,
      setQuery,
      results,
      searchActive,
      setSearchActive,
      activeMode,
      setActiveMode,
      markRendered,
      notifyModeChange,
      isLoading,
      teamError: teamError ? errorToString(teamError) : null,
      leagueError: leagueError ? errorToString(leagueError) : null,
      refetch,
    }),
    [
      query,
      results,
      searchActive,
      activeMode,
      markRendered,
      notifyModeChange,
      isLoading,
      teamError,
      leagueError,
      refetch,
    ],
  );
}
