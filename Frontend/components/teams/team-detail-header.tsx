import React from "react";
import { View, StyleSheet } from "react-native";
import { Header } from "@/components/header/header";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/header/page-title";

interface TeamDetailHeaderProps {
  readonly title: string;
  readonly id: string;
  readonly isOwner: boolean;
  readonly isMember: boolean;
  readonly onFollow: () => void;
}

export function TeamDetailHeader({
  title,
  id,
  isOwner,
  isMember,
  onFollow,
}: TeamDetailHeaderProps) {
  return (
    <Header
      left={<Button type="back" />}
      center={<PageTitle title={title} />}
      right={
        (isOwner || isMember) ? (
          <View style={styles.ownerActions}>
            <View style={styles.ownerActionButton}>
              <Button
                type="custom"
                route={`/teams/${id}/manage-roles`}
                icon="person.2.fill"
              />
            </View>
            <View style={styles.ownerActionButton}>
              <Button
                type="custom"
                route={`/teams/${id}/settings`}
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
