export interface SearchResult {
  id: string;
  type: 'team' | 'league';
  name: string;
  subtitle: string;
  logo: string;
  league: string;
}

export const mockSearchResults: SearchResult[] = [
  { id: '1', type: 'team', name: 'FC Barcelona', subtitle: 'Team in La Liga', logo: '⚽', league: 'La Liga' },
  { id: '2', type: 'team', name: 'Real Madrid', subtitle: 'Team in La Liga', logo: '⚽', league: 'La Liga' },
  { id: '3', type: 'team', name: 'Manchester City', subtitle: 'Team in Premier League', logo: '⚽', league: 'Premier League' },
  { id: '4', type: 'team', name: 'Liverpool', subtitle: 'Team in Premier League', logo: '⚽', league: 'Premier League' },
  { id: '5', type: 'team', name: 'Bayern Munich', subtitle: 'Team in Bundesliga', logo: '⚽', league: 'Bundesliga' },
  { id: '6', type: 'team', name: 'Paris Saint-Germain', subtitle: 'Team in Ligue 1', logo: '⚽', league: 'Ligue 1' },
  { id: '7', type: 'team', name: 'AC Milan', subtitle: 'Team in Serie A', logo: '⚽', league: 'Serie A' },
  { id: '8', type: 'team', name: 'Inter Miami', subtitle: 'Team in MLS', logo: '⚽', league: 'MLS' },
  { id: '9', type: 'league', name: 'La Liga', subtitle: 'Spanish League', logo: '🇪🇸', league: 'La Liga' },
  { id: '10', type: 'league', name: 'Premier League', subtitle: 'English League', logo: '🇬🇧', league: 'Premier League' },
  { id: '11', type: 'league', name: 'Bundesliga', subtitle: 'German League', logo: '🇩🇪', league: 'Bundesliga' },
  { id: '12', type: 'league', name: 'Serie A', subtitle: 'Italian League', logo: '🇮🇹', league: 'Serie A' },
];

export function filterSearchResults(query: string): SearchResult[] {
  const q = (query || '').toLowerCase().trim();
  if (!q) return mockSearchResults;
  return mockSearchResults.filter((r) =>
    r.name.toLowerCase().includes(q) ||
    r.subtitle.toLowerCase().includes(q) ||
    r.league.toLowerCase().includes(q)
  );
}

export default { mockSearchResults, filterSearchResults };
