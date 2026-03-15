import { ImageSource } from "expo-image";

export interface SearchResult {
  id: string;
  type: "team" | "league" | "tournament";
  name: string;
  subtitle: string;
  logo: ImageSource;
  league?: string;
  sport: string;
  location: string;
  privacy?: string;
}

export type SearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  searchActive: boolean;
  setSearchActive: (active: boolean) => void;
  activeMode?: Modes;
  setActiveMode: (mode: Modes) => void;
  isLoading?: boolean;
  teamError?: string | null;
  leagueError?: string | null;
  markRendered: (
    renderTookMs: number,
    opts?: {
      mode?: Modes;
      resultCount?: number;
      query?: string;
    },
  ) => void;
  notifyModeChange: (mode: Modes, resultCount: number) => void;
  refetch: () => Promise<unknown>;
};

export type Modes = "teams" | "leagues" | "tournaments";

export interface SearchModeConfig {
  key: Modes;
  label: string;
  type: SearchResult["type"];
}

export const Tabs: SearchModeConfig[] = [
  { key: "teams", label: "Teams", type: "team" },
  { key: "leagues", label: "Leagues", type: "league" },
  { key: "tournaments", label: "Tournaments", type: "tournament" },
];
