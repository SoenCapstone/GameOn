import { SearchResult, mockSearchResults } from './constants';

export function filterSearchResults(query: string): SearchResult[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return mockSearchResults;
  return mockSearchResults.filter((r) =>
    r.name.toLowerCase().includes(q) ||
    r.subtitle.toLowerCase().includes(q) ||
    r.league.toLowerCase().includes(q)
  );
}
