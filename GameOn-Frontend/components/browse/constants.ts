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
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 700,
  },
  resultsWrapper: {
    flex: 1,
    height: "100%",
    width: "100%",
    alignSelf: "center",
  },
  pressableWrapper: {
    width: "100%",
    alignItems: "center",
  },
  resultCard: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  logoText: {
    fontSize: 20,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 14,
    color: "#FFFFFF80",
    fontWeight: "500",
  },
  rightIconContainer: {
    marginLeft: 12,
  },
  scrollContainer: {
    width: "100%",
    height: "100%",
  },
  resultsContentStatic: {
    paddingVertical: 10,
  },
});
