import React from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";

interface TeamDetailHeaderProps {
  readonly title: string;
  readonly id: string;
  readonly isActiveMember: boolean;
  readonly onFollow: () => void;
}

export function TeamDetailHeader({
  title,
  id,
  isActiveMember,
  onFollow,
}: TeamDetailHeaderProps) {
  const renderRightButton = () => {
    if (isActiveMember) {
      return (
        <View style={styles.ownerActions}>
          <View style={styles.ownerActionButton}>
            <Button
              type="custom"
              route={`/teams/${id}/manage-roles`}
              icon="person.2.fill"
            />
          </View>
          <View style={styles.ownerActionButton}>
            <Button type="custom" route={`/teams/${id}/settings`} icon="gear" />
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

export const styles = StyleSheet.create({
  ownerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  ownerActionButton: {
    width: 44,
    height: 44,
  },
});
