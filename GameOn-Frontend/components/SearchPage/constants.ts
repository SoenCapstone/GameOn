import { StyleSheet } from 'react-native';

export const HEADER_BASE_HEIGHT = 75;

export interface SearchResult {
  id: string;
  type: 'team' | 'league';
  name: string;
  subtitle: string;
  logo: string;
  league: string;
}

export type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  markRendered: (renderTookMs: number) => void;
};

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

export default { mockSearchResults };
 
export const searchStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 700,
  },
});
