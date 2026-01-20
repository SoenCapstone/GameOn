import React from "react";
import { View } from "react-native";
import { Header } from "@/components/header/header";
import { HeaderButton } from "@/components/header/header-button";
import { PageTitle } from "@/components/header/page-title";
import { styles } from "@/components/teams/team-detail-header";

interface LeagueDetailHeaderProps {
  readonly title: string;
  readonly id: string;
  readonly isOwner: boolean;
  readonly onFollow: () => void;
}

export function LeagueDetailHeader({
  title,
  id,
  isOwner,
  onFollow,
}: LeagueDetailHeaderProps) {
  return (
    <Header
      left={<HeaderButton type="back" />}
      center={<PageTitle title={title} />}
      right={
        isOwner ? (
          <View style={styles.ownerActions}>
            <View style={styles.ownerActionButton}>
              <HeaderButton
                type="custom"
                route={`/leagues/${id}/manage`}
                icon="person.2.fill"
              />
            </View>
            <View style={styles.ownerActionButton}>
              <HeaderButton
                type="custom"
                route={`/leagues/${id}/settings`}
                icon="gear"
              />
            </View>
          </View>
        ) : (
          <HeaderButton type="custom" label="Follow" onPress={onFollow} />
        )
      }
    />
  );
}
