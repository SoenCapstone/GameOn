import {
  SearchResult,
  mockSearchResults,
} from "@/components/SearchPage/constants";
import * as SecureStore from "expo-secure-store";

// Map common sports to emoji as a fallback for missing logos.
export function mapSportToEmoji(sport?: string | null): string {
  const s = (sport || "").toLowerCase();
  switch (s) {
    case "soccer":
    case "football (soccer)":
    case "futbol":
      return "⚽";
    case "basketball":
      return "🏀";
    case "baseball":
      return "⚾";
    case "american football":
    case "nfl":
      return "🏈";
    case "hockey":
    case "ice hockey":
      return "🏒";
    case "tennis":
      return "🎾";
    case "rugby":
      return "🏉";
    case "volleyball":
      return "🏐";
    case "cricket":
      return "🏏";
    case "golf":
      return "⛳️";
    default:
      return "🏅";
  }
}

// Filter for mock leagues only (until backend provides leagues endpoint)
export function filterLocalLeagues(query: string): SearchResult[] {
  const q = (query || "").toLowerCase().trim();
  const leagues = mockSearchResults.filter((r) => r.type === "league");
  if (!q) return leagues;
  return leagues.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.league.toLowerCase().includes(q),
  );
}

type TeamSummaryResponse = {
  id: string;
  name: string;
  sport?: string | null;
  leagueId?: string | null;
  slug: string;
  logoUrl?: string | null;
  privacy: string;
  maxRoster?: number | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

type TeamListResponse = {
  items: TeamSummaryResponse[];
  totalElements: number;
  page: number;
  size: number;
  hasNext: boolean;
};

function getApiBase(): string {
  // Prefer public Expo env var if provided; fallback to local gateway port.
  // Example: EXPO_PUBLIC_API_BASE=http://localhost:8222
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE as string | undefined;
  return fromEnv || "http://localhost:8222";
}

export async function fetchTeamResults(query: string): Promise<SearchResult[]> {
  const base = getApiBase();
  const params = new URLSearchParams();
  if (query && query.trim().length > 0) params.set("q", query.trim());
  params.set("size", "20");

  const token = await SecureStore.getItemAsync("token");
  const res = await fetch(`${base}/api/v1/teams?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    // Return empty to allow UI to continue showing leagues/mock content if needed
    return [];
  }

  const data = (await res.json()) as TeamListResponse;
  const mapped: SearchResult[] = (data.items || []).map((t) => ({
    id: String(t.id),
    type: "team",
    name: t.name,
    subtitle: t.sport ? `${t.sport}` : "Team",
    // Use logoUrl from backend if available, otherwise fallback to emoji
    logo: t.logoUrl || mapSportToEmoji(t.sport),
    league: "",
  }));
  return mapped;
}
