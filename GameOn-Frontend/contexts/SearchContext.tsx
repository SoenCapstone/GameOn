import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SearchResult, SearchContextValue } from '@/components/SearchPage/constants';
import { filterSearchResults } from '@/components/SearchPage/utils';
import { createScopedLog } from '@/utils/logger';

const ctxLog = createScopedLog('Search.context');

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [results, setResults] = useState<SearchResult[]>(() => filterSearchResults(''));
  // track last search metadata so we can emit a single combined log after render
  const lastSearchRef = React.useRef<{
    id: number;
    query: string;
    resultCount: number;
    mode?: 'teams' | 'leagues';
  } | null>(null);
  const nextId = React.useRef(1);

  useEffect(() => {
    const filtered = filterSearchResults(query);
    setResults(filtered);
    // store metrics and wait for UI render to print a single combined log
    lastSearchRef.current = {
      id: nextId.current++,
      query,
      resultCount: filtered.length,
    };
    // also emit an immediate log for the query change (tookMs = 0). This ensures every query change is recorded.
    try {
      // compute displayedCount the same way the UI will: if a mode is set, restrict by type
      let displayedCount = filtered.length;
      if (lastSearchRef.current?.mode) {
        const mode = lastSearchRef.current.mode;
        const q = (query || '').toLowerCase().trim();
        // name-only match for UI behavior
        displayedCount = filtered
          .filter((r) => (mode === 'teams' ? r.type === 'team' : r.type === 'league'))
          .filter((r) => {
            if (!q) return true;
            return r.name.toLowerCase().includes(q);
          }).length;
      }

      const payload: Record<string, any> = { query, resultCount: displayedCount, tookMs: 0 };
      if (lastSearchRef.current?.mode) payload.mode = lastSearchRef.current.mode;
      ctxLog.info('search completed', payload);
      // clear metadata so markRendered won't double-log the same query
      lastSearchRef.current = null;
    } catch {
      // swallow logging errors; lastSearchRef still set for UI-driven logging
    }
  }, [query]);

  const markRendered = (
    renderTookMs: number,
    opts?: { mode?: 'teams' | 'leagues'; resultCount?: number; query?: string }
  ) => {
    const meta = lastSearchRef.current;
    if (!meta && !opts) return;
    // build base payload
    const payload: Record<string, any> = {
      query: opts?.query ?? meta?.query ?? '',
      resultCount: opts?.resultCount ?? meta?.resultCount ?? 0,
      tookMs: renderTookMs,
    };

    // if caller provided mode, include it in the log
  if (opts?.mode) payload.mode = opts.mode;

    ctxLog.info('search completed', payload);
    // clear to avoid duplicate logs
    lastSearchRef.current = null;
  };

  const logModeChange = React.useCallback((mode: 'teams' | 'leagues', resultCount: number) => {
    // update lastSearchRef so the subsequent markRendered will include the mode
    if (lastSearchRef.current) {
      lastSearchRef.current.mode = mode;
      lastSearchRef.current.resultCount = resultCount;
    } else {
      // use current query state if available when creating a placeholder
      lastSearchRef.current = {
        id: nextId.current++,
        query: query,
        resultCount,
        mode,
      };
    }
  }, [query]);
  const value = useMemo(() => ({ 
    query, 
    setQuery, 
    results, 
    searchActive, 
    setSearchActive, 
    markRendered, 
    notifyModeChange: logModeChange 
  }), [query, results, searchActive, logModeChange]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
