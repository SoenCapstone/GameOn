import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type InviteSectionProps = Readonly<{
  title: string;
  isBusy: boolean;
  emptyText: string;
  hasItems: boolean;
  children: React.ReactNode;
}>;

export function InviteSection({
  title,
  isBusy,
  emptyText,
  hasItems,
  children,
}: InviteSectionProps) {
  return (
    <View style={inviteSectionStyles.section}>
      <Text style={inviteSectionStyles.sectionTitle}>{title}</Text>

      {isBusy && <ActivityIndicator size="small" color="#fff" />}

      {!isBusy && !hasItems ? (
        <Text style={inviteSectionStyles.emptyText}>{emptyText}</Text>
      ) : (
        <View style={inviteSectionStyles.memberList}>{children}</View>
      )}
    </View>
  );
}

export const inviteSectionStyles = StyleSheet.create({
  section: {
    width: "100%",
    gap: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
  memberList: {
    gap: 14,
  },
  inviteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,82,255,0.35)",
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    color: "#bcd4ff",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
});
