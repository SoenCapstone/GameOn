import React, { useEffect, useState } from "react";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { mockSearchResults, SearchResult } from "@/components/browse/constants";

export function useMockTeam(id?: string) {
  const [team, setTeam] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const currentTeam = mockSearchResults.find(
      (r) => r.id === id && r.type === "team",
    ) as SearchResult | undefined;
    setTeam(currentTeam ?? null);
    setLoading(false);
  }, [id]);

  return { team, loading } as { team: SearchResult | null; loading: boolean };
}

export function TeamHeader({ title, id }: { title: string; id: string }) {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        <HeaderButton
          type="custom"
          route={`/teams/${id}/settings`}
          icon="gear"
        />
      }
    />
  );
}

export function SettingsHeader() {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title="Team Settings" />}
    />
  );
}
