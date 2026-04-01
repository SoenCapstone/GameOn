import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Image } from "expo-image";
import { GlassView } from "expo-glass-effect";
import {
  RefereeMatchInviteCard,
  TeamMatchInviteCard,
} from "@/types/matches";
import { LeagueInviteCard } from "@/types/leagues";
import { getSportLogo } from "@/utils/search";

const denyColor = "#ff5b55";

export type TeamInviteCard = {
  kind: "team";
  id: string;
  teamName: string;
  inviterName?: string;
  teamId: string;
  logoUrl?: string | null;
  sport?: string | null;
};

export type InviteCardItem =
  | TeamInviteCard
  | LeagueInviteCard
  | TeamMatchInviteCard
  | RefereeMatchInviteCard;

type InviteCardProps = Readonly<{
  invite: InviteCardItem;
  onAcceptTeam: (inviteId: string) => void;
  onDeclineTeam: (inviteId: string) => void;
  onAcceptLeague: (inviteId: string) => void;
  onDeclineLeague: (inviteId: string) => void;
  onRespondTeamMatch: (matchId: string, isAccepted: boolean) => void;
  onRespondRefereeMatch: (matchId: string, isAccepted: boolean) => void;
}>;

export function InviteCard({
  invite,
  onAcceptTeam,
  onDeclineTeam,
  onAcceptLeague,
  onDeclineLeague,
  onRespondTeamMatch,
  onRespondRefereeMatch,
}: InviteCardProps) {
  const content = getInviteContent(invite);

  return (
    <Card isInteractive={false}>
      <View style={styles.container}>
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
              label="Deny"
              tone="danger"
              onPress={content.onDecline}
            />
            <InviteActionButton label="Accept" onPress={content.onAccept} />
          </View>
        </View>
      </View>
    </Card>
  );

  function getInviteContent(item: InviteCardItem) {
    if (item.kind === "team") {
      return {
        spaceName: item.teamName,
        logoUrl: item.logoUrl,
        sport: item.sport,
        body: `You received an invite${
          item.inviterName ? ` from ${item.inviterName}` : ""
        } to join ${item.teamName}.`,
        onAccept: () => onAcceptTeam(item.id),
        onDecline: () => onDeclineTeam(item.id),
      };
    }

    if (item.kind === "team-match") {
      return {
        spaceName: item.homeTeamName,
        logoUrl: item.logoUrl,
        sport: item.sport,
        body: `${item.homeTeamName} invited ${item.awayTeamName} to a team match.`,
        onAccept: () => onRespondTeamMatch(item.matchId, true),
        onDecline: () => onRespondTeamMatch(item.matchId, false),
      };
    }

    if (item.kind === "referee-match") {
      return {
        spaceName: item.homeTeamName,
        logoUrl: item.logoUrl,
        sport: item.sport,
        body: `You received an invitation to referee ${item.homeTeamName} vs ${item.awayTeamName}.`,
        onAccept: () => onRespondRefereeMatch(item.matchId, true),
        onDecline: () => onRespondRefereeMatch(item.matchId, false),
      };
    }

    return {
      spaceName: item.leagueName,
      logoUrl: item.logoUrl,
      sport: item.sport,
      body: `You received an invite to join ${item.leagueName} with ${item.teamName}.`,
      onAccept: () => onAcceptLeague(item.id),
      onDecline: () => onDeclineLeague(item.id),
    };
  }
}

type InviteActionButtonProps = Readonly<{
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
}>;

function InviteActionButton({
  label,
  onPress,
  tone = "default",
}: InviteActionButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.actionPressable}>
      <GlassView
        glassEffectStyle="regular"
        isInteractive={true}
        style={styles.actionGlass}
      >
        <Text
          style={[
            styles.actionLabel,
            tone === "danger" && styles.actionLabelDanger,
          ]}
        >
          {label}
        </Text>
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
    minWidth: 108,
  },
  actionGlass: {
    height: 44,
    borderRadius: 999,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "transparent",
  },
  actionLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
  actionLabelDanger: {
    color: denyColor,
  },
});
