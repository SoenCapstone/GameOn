import {
  SearchResult,
  mockSearchResults,
} from "@/components/SearchPage/constants";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

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

async function fetchTeamResults(query: string): Promise<SearchResult[]> {
  const params: Record<string, string> = { size: "20" };
  if (query && query.trim().length > 0) params.q = query.trim();

  const base = "http://localhost:8091";
  const token = await SecureStore.getItemAsync("token");
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Dev helper: inject X-User-Id header
  const devUserId = (process.env.EXPO_PUBLIC_DEV_USER_ID as string) || (base.includes("localhost") ? "1001" : "");
  if (devUserId) headers["X-User-Id"] = devUserId;

  try {
    const resp = await axios.get<TeamListResponse>(`${base}/api/v1/teams`, {
      headers,
      params,
      timeout: 5000,
    });
    const data = resp.data;
    const mapped: SearchResult[] = (data.items || []).map((t: TeamSummaryResponse) => ({
      id: String(t.id),
      type: "team",
      name: t.name,
      subtitle: t.sport ? `${t.sport}` : "Team",
      // Use logoUrl from backend if available, otherwise fallback to emoji
      logo: t.logoUrl || mapSportToEmoji(t.sport),
      league: "",
    }));
    return mapped;
  } catch (err) {
    console.warn("fetchTeamResults failed", err);
    return [];
  }
}

export function useTeamResults(query: string) {
  return useQuery<SearchResult[], Error>({
    queryKey: ["teams", query],
    queryFn: () => fetchTeamResults(query),
    retry: 1,
  });
}

export { fetchTeamResults as fetchTeamResults };
