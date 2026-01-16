import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getInitials } from "@/components/teams/member-row-utils";

type MemberRowProps = {
  readonly name: string;
  readonly email?: string | null;
  readonly right?: React.ReactNode;
};

export function MemberRow({ name, email, right }: Readonly<MemberRowProps>) {
  return (
    <View style={styles.memberRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(name, email)}</Text>
      </View>

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        <Text style={styles.memberEmail}>{email ?? ""}</Text>
      </View>

      {right ? <View style={styles.memberActions}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  memberEmail: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
  },
  memberActions: {
    alignItems: "flex-end",
    gap: 6,
  },
});
