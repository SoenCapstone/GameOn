export interface SearchResult {
  id: string;
  type: "team" | "league";
  name: string;
  subtitle: string;
  logo: string;
  league?: string;
  sport: string;
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
    id: "1",
    type: "league",
    name: "LaLiga",
    subtitle: "Spanish League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywe0Ww4kLBQkyTvZ4NKYblsP2DpHoJdLeOCtha",
    sport: "Soccer",
  },
  {
    id: "2",
    type: "league",
    name: "Premier League",
    subtitle: "English League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73YwphSzaZcwESdRnsKtCl6Q1GZf40A5bNUTOoDj",
    sport: "Soccer",
  },
  {
    id: "3",
    type: "league",
    name: "Bundesliga",
    subtitle: "German League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywgz2c3TkMlKNOHzgpc1tIBJXdAY6WRxiPf8eb",
    sport: "Soccer",
  },
  {
    id: "4",
    type: "league",
    name: "Serie A",
    subtitle: "Italian League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywz9cECa2VCWqp2Qhv1TjJSfE4eobVwDUcMYFI",
    sport: "Soccer",
  },
  {
    id: "5",
    type: "league",
    name: "LaLiga",
    subtitle: "Spanish League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywe0Ww4kLBQkyTvZ4NKYblsP2DpHoJdLeOCtha",
    sport: "Soccer",
  },
  {
    id: "6",
    type: "league",
    name: "Premier League",
    subtitle: "English League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73YwphSzaZcwESdRnsKtCl6Q1GZf40A5bNUTOoDj",
    sport: "Soccer",
  },
  {
    id: "7",
    type: "league",
    name: "Bundesliga",
    subtitle: "German League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywgz2c3TkMlKNOHzgpc1tIBJXdAY6WRxiPf8eb",
    sport: "Soccer",
  },
  {
    id: "8",
    type: "league",
    name: "Serie A",
    subtitle: "Italian League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywz9cECa2VCWqp2Qhv1TjJSfE4eobVwDUcMYFI",
    sport: "Soccer",
  },
  {
    id: "9",
    type: "team",
    name: "LA Lakers",
    subtitle: "Italian League",
    logo: "https://7jyhwes2xx.ufs.sh/f/ly3h7E4B73Ywz9cECa2VCWqp2Qhv1TjJSfE4eobVwDUcMYFI",
    sport: "Basketball",
  },
];
