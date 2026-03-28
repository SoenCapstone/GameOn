export type TeamSummaryResponse = {
  id: string;
  name: string;
  sport?: string | null;
  location?: string | null;
  leagueId?: string | null;
  slug?: string | null;
  logoUrl?: string | null;
  privacy?: string | null;
  maxRoster?: number | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TeamListResponse = {
  items: TeamSummaryResponse[];
  totalElements: number;
  page: number;
  size: number;
  hasNext: boolean;
};
