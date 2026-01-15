import React, { createContext, useContext, useMemo } from "react";
import { useTeamDetail } from "@/hooks/use-team-detail";

type TeamDetailContextValue = ReturnType<typeof useTeamDetail> & { id: string };

const TeamDetailContext = createContext<TeamDetailContextValue | null>(null);

export function TeamDetailProvider({
  id,
  children,
}: {
  readonly id: string;
  readonly children: React.ReactNode;
}) {
  const detail = useTeamDetail(id);
  const value = useMemo(() => ({ id, ...detail }), [id, detail]);
  return (
    <TeamDetailContext.Provider value={value}>
      {children}
    </TeamDetailContext.Provider>
  );
}

export function useTeamDetailContext() {
  const ctx = useContext(TeamDetailContext);
  if (!ctx)
    throw new Error("useTeamDetailContext must be used inside provider");
  return ctx;
}
