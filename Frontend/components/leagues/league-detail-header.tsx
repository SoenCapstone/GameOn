import React from "react";
import { View } from "react-native";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
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
      left={<Button type="back" />}
      center={<PageTitle title={title} />}
      right={
        isOwner ? (
          <View style={styles.ownerActions}>
            <View style={styles.ownerActionButton}>
              <Button
                type="custom"
                route={`/leagues/${id}/manage`}
                icon="person.2.fill"
              />
            </View>
            <View style={styles.ownerActionButton}>
              <Button
                type="custom"
                route={`/leagues/${id}/settings`}
                icon="gear"
              />
            </View>
          </View>
        ) : (
          <Button type="custom" label="Follow" onPress={onFollow} />
        )
      }
    />
  );
}
