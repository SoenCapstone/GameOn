import React, { createContext, useContext, useMemo } from "react";
import { useLeagueDetail } from "@/hooks/use-league-detail";

type LeagueDetailContextValue = ReturnType<typeof useLeagueDetail> & { id: string };

const LeagueDetailContext = createContext<LeagueDetailContextValue | null>(null);

export function LeagueDetailProvider({
  id,
  children,
}: {
  readonly id: string;
  readonly children: React.ReactNode;
}) {
  const detail = useLeagueDetail(id);
  const value = useMemo(() => ({ id, ...detail }), [id, detail]);
  return (
    <LeagueDetailContext.Provider value={value}>
      {children}
    </LeagueDetailContext.Provider>
  );
}

export function useLeagueDetailContext() {
  const ctx = useContext(LeagueDetailContext);
  if (!ctx)
    throw new Error("useLeagueDetailContext must be used inside provider");
  return ctx;
}
