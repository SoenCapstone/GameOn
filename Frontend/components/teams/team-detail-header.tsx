import React from "react";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";

interface TeamDetailHeaderProps {
  readonly title: string;
  readonly id: string;
  readonly isOwner: boolean;
  readonly onFollow: () => void;
}

export function TeamDetailHeader({
  title,
  id,
  isOwner,
  onFollow,
}: TeamDetailHeaderProps) {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        isOwner ? (
          <HeaderButton
            type="custom"
            route={`/teams/${id}/settings`}
            icon="gear"
          />
        ) : (
          <HeaderButton type="custom" label="Follow" onPress={onFollow} />
        )
      }
    />
  );
}
