import { StyleSheet } from "react-native";

export interface SearchResult {
  id: string;
  type: "team" | "league";
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
  isLoading?: boolean;
  error?: string | null;
  markRendered: (
    renderTookMs: number,
    opts?: { mode?: "teams" | "leagues"; resultCount?: number; query?: string },
  ) => void;
  notifyModeChange: (mode: "teams" | "leagues", resultCount: number) => void;
};

export const mockSearchResults: SearchResult[] = [
  {
    id: "9",
    type: "league",
    name: "La Liga",
    subtitle: "Spanish League",
    logo: "🇪🇸",
    league: "La Liga",
  },
  {
    id: "10",
    type: "league",
    name: "Premier League",
    subtitle: "English League",
    logo: "🇬🇧",
    league: "Premier League",
  },
  {
    id: "11",
    type: "league",
    name: "Bundesliga",
    subtitle: "German League",
    logo: "🇩🇪",
    league: "Bundesliga",
  },
  {
    id: "12",
    type: "league",
    name: "Serie A",
    subtitle: "Italian League",
    logo: "🇮🇹",
    league: "Serie A",
  },
];

export const searchStyles = StyleSheet.create({
  logoText: {
    fontSize: 30,
  },
  separator: {
    height: 8,
  },
  resultsContentStatic: {
    paddingVertical: 10,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 8,
  },
  errorContainer: {
    backgroundColor: "#661313",
    padding: 8,
    marginVertical: 6,
    borderRadius: 8,
  },
  errorText: {
    color: "#fff",
  },
});
