import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  SearchResult,
  SearchContextValue,
} from "@/components/browse/constants";
import { filterLocalLeagues, useTeamResults } from "@/components/browse/utils";
import { createScopedLog } from "@/utils/logger";

const ctxLog = createScopedLog("Search.context");

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  // track last search metadata so we can emit a single combined log after render
  const lastSearchRef = React.useRef<{
    id: number;
    query: string;
    resultCount: number;
    mode?: "teams" | "leagues";
  } | null>(null);
  const nextId = React.useRef(1);

  const teamQuery = useTeamResults(query);

  // Combine team results with leagues when data changes
  useEffect(() => {
    const teamItems = (teamQuery.data ?? []).slice().reverse();
    const leagueItems = filterLocalLeagues(query);
    const combined = [...teamItems, ...leagueItems];
    setResults(combined);

    // store metrics and wait for UI render to print a single combined log
    lastSearchRef.current = {
      id: nextId.current++,
      query,
      resultCount: combined.length,
    };

    try {
      let displayedCount = combined.length;
      if (lastSearchRef.current?.mode) {
        const mode = lastSearchRef.current.mode;
        const q = (query || "").toLowerCase().trim();
        displayedCount = combined
          .filter((r) =>
            mode === "teams" ? r.type === "team" : r.type === "league",
          )
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
      if (lastSearchRef.current?.mode)
        payload.mode = lastSearchRef.current.mode;
      ctxLog.info("search completed", payload);
      lastSearchRef.current = null;
    } catch {
      // ignore logging failures
    }
  }, [teamQuery.data, query]);

  const markRendered = (
    renderTookMs: number,
    opts?: { mode?: "teams" | "leagues"; resultCount?: number; query?: string },
  ) => {
    const meta = lastSearchRef.current;
    if (!meta && !opts) return;
    const payload: Record<string, string | number> = {
      query: opts?.query ?? meta?.query ?? "",
      resultCount: opts?.resultCount ?? meta?.resultCount ?? 0,
      tookMs: renderTookMs,
    };

    // if caller provided mode, include it in the log
    if (opts?.mode) payload.mode = opts.mode;

    ctxLog.info("search completed", payload);
    // avoid duplicate logs
    lastSearchRef.current = null;
  };

  const logModeChange = React.useCallback(
    (mode: "teams" | "leagues", resultCount: number) => {
      // update lastSearchRef so markRendered will include the mode
      if (lastSearchRef.current) {
        lastSearchRef.current.mode = mode;
        lastSearchRef.current.resultCount = resultCount;
      } else {
        lastSearchRef.current = {
          id: nextId.current++,
          query: query,
          resultCount,
          mode,
        };
      }
    },
    [query],
  );
  const value = useMemo(
    () => ({
      query,
      setQuery,
      results,
      searchActive,
      setSearchActive,
      markRendered,
      notifyModeChange: logModeChange,
      isLoading: teamQuery.isLoading,
      error: teamQuery.error ? String(teamQuery.error) : null,
    }),
    [
      query,
      results,
      searchActive,
      logModeChange,
      teamQuery.isLoading,
      teamQuery.error,
    ],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}
