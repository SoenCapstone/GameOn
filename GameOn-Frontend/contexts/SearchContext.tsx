import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SearchResult, SearchContextValue } from '@/components/SearchPage/constants';
import { filterSearchResults } from '@/components/SearchPage/utils';
import { createScopedLog } from '@/utils/logger';

const ctxLog = createScopedLog('Search.context');

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>(() => filterSearchResults(''));
  // track last search metadata so we can emit a single combined log after render
  const lastSearchRef = React.useRef<{
    id: number;
    query: string;
    resultCount: number;
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
  }, [query]);

  const markRendered = (renderTookMs: number) => {
    const meta = lastSearchRef.current;
    if (!meta) return;
    // print single log for this query containing render duration (tookMs)
    ctxLog.info('search completed', {
      query: meta.query,
      resultCount: meta.resultCount,
      tookMs: renderTookMs,
    });
    // clear to avoid duplicate logs
    lastSearchRef.current = null;
  };

  const value = useMemo(() => ({ query, setQuery, results, markRendered }), [query, results]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
