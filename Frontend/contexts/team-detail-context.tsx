import React, { createContext, useContext } from "react";
import { useTeamDetail } from "@/hooks/use-team-detail";

type TeamDetailContextValue = ReturnType<typeof useTeamDetail> & { id: string };

const TeamDetailContext = createContext<TeamDetailContextValue | null>(null);

export function TeamDetailProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const detail = useTeamDetail(id);
  return (
    <TeamDetailContext.Provider value={{ id, ...detail }}>
      {children}
    </TeamDetailContext.Provider>
  );
}

export function useTeamDetailContext() {
  const ctx = useContext(TeamDetailContext);
  if (!ctx) throw new Error("useTeamDetailContext must be used inside provider");
  return ctx;
}