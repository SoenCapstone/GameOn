export interface SearchResult {
  id: string;
  type: "team" | "league" | "tournament";
  name: string;
  subtitle: string;
  logo: string;
  league?: string;
  sport: string;
  location: string;
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
  error?: string | null;
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

export const SPACES_MODES: SearchModeConfig[] = [
  { key: "teams", label: "Teams", type: "team" },
  { key: "leagues", label: "Leagues", type: "league" },
  { key: "tournaments", label: "Tournaments", type: "tournament" },
];

export const mockSearchResults: SearchResult[] = [
  {
    id: "b3e1c2d4-5f6a-4b7c-8d9e-0123456789ab",
    type: "team",
    name: "Montreal FC",
    subtitle: "Montreal, QC",
    logo: "https://upload.wikimedia.org/wikipedia/en/d/d9/CF_Montreal_logo_2023.svg",
    sport: "Soccer",
    location: "Montreal",
  },
  {
    id: "d2b8f3c4-6e7a-48b1-9f2d-1234567890ab",
    type: "team",
    name: "Toronto Blue Jays",
    subtitle: "Toronto, ON",
    logo: "https://upload.wikimedia.org/wikipedia/en/c/cc/Toronto_Blue_Jay_Primary_Logo.svg",
    sport: "Baseball",
    location: "Toronto",
  },
  ...[
    {
      id: "1",
      name: "LaLiga",
      subtitle: "Spanish League",
      logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywe0Ww4kLBQkyTvZ4NKYblsP2DpHoJdLeOCtha",
      sport: "Soccer",
      location: "Spain",
    },
    {
      id: "2",
      name: "Premier League",
      subtitle: "English League",
      logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73YwphSzaZcwESdRnsKtCl6Q1GZf40A5bNUTOoDj",
      sport: "Soccer",
      location: "England",
    },
    {
      id: "3",
      name: "Bundesliga",
      subtitle: "German League",
      logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywgz2c3TkMlKNOHzgpc1tIBJXdAY6WRxiPf8eb",
      sport: "Soccer",
      location: "Germany",
    },
    {
      id: "4",
      name: "Serie A",
      subtitle: "Italian League",
      logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywz9cECa2VCWqp2Qhv1TjJSfE4eobVwDUcMYFI",
      sport: "Soccer",
      location: "Italy",
    },
  ].map((l) => ({ ...l, type: "league" as const }) as SearchResult),
];
