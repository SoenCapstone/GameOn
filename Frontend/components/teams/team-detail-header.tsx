import React from "react";
import { View, StyleSheet } from "react-native";
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
          <View style={styles.ownerActions}>
            <View style={styles.ownerActionButton}>
              <HeaderButton
                type="custom"
                route={`/teams/${id}/manage-roles`}
                icon="person.2.fill"
              />
            </View>
            <View style={styles.ownerActionButton}>
              <HeaderButton
                type="custom"
                route={`/teams/${id}/settings`}
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

const styles = StyleSheet.create({
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
