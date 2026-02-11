import React from "react";
import { View } from "react-native";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";
import { styles } from "@/components/teams/team-detail-header";

interface LeagueDetailHeaderProps {
  readonly title: string;
  readonly id: string;
  readonly isActiveMember: boolean;
  readonly onFollow: () => void;
}

export function LeagueDetailHeader({
  title,
  id,
  isActiveMember,
  onFollow,
}: LeagueDetailHeaderProps) {
  const renderRightButton = () => {
    if (isActiveMember) {
      return (
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
      );
    }

    if (!isActiveMember) {
      return <Button type="custom" label="Follow" onPress={onFollow} />;
    }

    return null;
  };

  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} />}
      right={renderRightButton()}
    />
  );
}
