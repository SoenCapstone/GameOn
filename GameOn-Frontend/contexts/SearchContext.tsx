import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SearchContextValue } from "@/components/browse/constants";
import { useTeamLeagueResults } from "@/components/browse/hooks/useTeamLeagueResults";
import { createScopedLog } from "@/utils/logger";
import { errorToString } from "@/utils/error";

const ctxLog = createScopedLog("Search.context");

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  // track last search data to log a single combined log after render
  const lastSearchRef = React.useRef<{
    id: number;
    query: string;
    resultCount: number;
    mode?: "teams" | "leagues";
  } | null>(null);
  const nextId = React.useRef(1);

  const teamLeague = useTeamLeagueResults(query);
  const combined = teamLeague.data;

  useEffect(() => {
    // store metrics for later use by markRendered
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
  }, [combined, query]);

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
      results: combined,
      searchActive,
      setSearchActive,
      markRendered,
      notifyModeChange: logModeChange,
      isLoading: teamLeague.isLoading,
      error: teamLeague.error ? errorToString(teamLeague.error) : null,
    }),
    [
      query,
      combined,
      searchActive,
      logModeChange,
      teamLeague.isLoading,
      teamLeague.error,
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
