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
  searchActive: boolean;
  setSearchActive: (active: boolean) => void;
  markRendered: (
    renderTookMs: number,
    opts?: { mode?: 'teams' | 'leagues'; resultCount?: number; query?: string }
  ) => void;
  notifyModeChange: (mode: 'teams' | 'leagues', resultCount: number) => void;
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
  resultsWrapper: {
    flex: 1,
    height: '100%',
    width: '100%',
    alignSelf: 'center',
  },
  pressableWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  resultCard: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logoText: {
    fontSize: 20,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 14,
    color: '#FFFFFF80',
    fontWeight: '500',
  },
  rightIconContainer: {
    marginLeft: 12,
  },
  scrollContainer: {
    width: '100%',
    height: '100%',
  },
  resultsContentStatic: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
