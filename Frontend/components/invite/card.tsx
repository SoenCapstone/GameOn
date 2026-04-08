import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { GlassView } from "expo-glass-effect";
import { NotificationItem, NotificationResponse } from "@/types/notifications";
import { getInviteContent } from "@/utils/notifications";
import { getSportLogo } from "@/utils/search";
import { AccentColors } from "@/constants/colors";
import { BlurView } from "expo-blur";

type InviteCardProps = Readonly<{
  invite: NotificationItem;
  onRespond: (response: NotificationResponse) => void;
}>;

export function InviteCard({ invite, onRespond }: InviteCardProps) {
  const content = getInviteContent(invite);

  return (
    <BlurView tint="systemUltraThinMaterialDark" style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.space}>
            <Image
              source={
                content.logoUrl
                  ? { uri: content.logoUrl }
                  : getSportLogo(content.sport)
              }
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.name}>{content.spaceName}</Text>
          </View>
          <Text style={styles.title}>Invitation</Text>
        </View>

        <Text style={styles.body}>{content.body}</Text>
      </View>

      <View style={styles.footer}>
        <View />
        <View style={styles.actions}>
          <InviteActionButton
            label="Decline"
            onPress={() => onRespond("decline")}
            destructive
          />
          <InviteActionButton
            label="Accept"
            onPress={() => onRespond("accept")}
          />
        </View>
      </View>
    </BlurView>
  );
}

type InviteActionButtonProps = Readonly<{
  label: string;
  onPress: () => void;
  destructive?: boolean;
}>;

function InviteActionButton({
  label,
  onPress,
  destructive = false,
}: InviteActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.actionPressable}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive={true}
        style={styles.actionGlass}
      >
        <Text style={[styles.actionLabel, destructive && styles.destructive]}>
          {label}
        </Text>
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 24,
    borderRadius: 34,
    overflow: "hidden",
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
  },
  content: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingRight: 8,
  },
  space: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "500",
    flexShrink: 1,
  },
  title: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  actionPressable: {
    minWidth: 100,
  },
  actionGlass: {
    height: 40,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "transparent",
  },
  actionLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  destructive: {
    color: AccentColors.red,
  },
});
