import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Pressable,
} from "react-native";
import { CardShell, CARD_WIDTH, CARD_HEIGHT } from "./shield-card";

type Stat = {
  label: string;
  value: number;
};

type CardType = "gold" | "silver" | "bronze" | "special";

type FifaStyleCardProps = {
  rating: number;
  name: string;
  position: string;
  team: string;
  nation: string;
  image?: ImageSourcePropType;
  cardType?: CardType;
  stats: [Stat, Stat, Stat, Stat, Stat, Stat];
  scale?: number;
  onPress?: () => void;
};

function getCardColors(cardType: CardType) {
  switch (cardType) {
    case "silver":
      return {
        top: "#d9dde3",
        bottom: "#8d96a1",
        border: "#e8edf2",
        accent: "#5e6875",
      };
    case "bronze":
      return {
        top: "#c88b5a",
        bottom: "#7e4727",
        border: "#dfb08b",
        accent: "#5f331c",
      };
    case "special":
      return {
        top: "#1d2240",
        bottom: "#101426",
        border: "#62d6ff",
        accent: "#d7f7ff",
      };
    case "gold":
    default:
      return {
        top: "#f6e7a8",
        bottom: "#ba9442",
        border: "#fff1ba",
        accent: "#6a4d12",
      };
  }
}

export function FifaStyleCard({
  rating,
  name,
  position,
  team,
  nation,
  image,
  cardType = "gold",
  stats,
  scale = 1,
  onPress,
}: FifaStyleCardProps) {
  const colors = getCardColors(cardType);

  const scaledWidth = CARD_WIDTH * scale;
  const scaledHeight = CARD_HEIGHT * scale;

  const card = (
    <View
      style={[
        styles.viewport,
        {
          width: scaledWidth,
          height: scaledHeight,
        },
      ]}
    >
      <View
        style={[
          styles.scaledRoot,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <CardShell
          topColor={colors.top}
          bottomColor={colors.bottom}
          borderColor={colors.border}
        >
          <View style={styles.content}>
            <View style={styles.topSection}>
              <View style={styles.leftMeta}>
                <Text style={[styles.rating, { color: colors.accent }]}>
                  {rating}
                </Text>
                <Text style={[styles.position, { color: colors.accent }]}>
                  {position.toUpperCase()}
                </Text>
              </View>

              <View style={styles.playerImageWrapper}>
                {image ? (
                  <Image
                    source={image}
                    style={styles.playerImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>GO</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.identitySection}>
              <Text
                style={[styles.name, { color: colors.accent }]}
                numberOfLines={1}
              >
                {name}
              </Text>

              <View style={styles.subRow}>
                <Text
                  style={[styles.subText, { color: colors.accent }]}
                  numberOfLines={1}
                >
                  {team}
                </Text>
                <Text style={[styles.dot, { color: colors.accent }]}>•</Text>
                <Text
                  style={[styles.subText, { color: colors.accent }]}
                  numberOfLines={1}
                >
                  {nation}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statsColumn}>
                <StatRow stat={stats[0]} accent={colors.accent} />
                <StatRow stat={stats[1]} accent={colors.accent} />
                <StatRow stat={stats[2]} accent={colors.accent} />
              </View>

              <View style={styles.statsColumn}>
                <StatRow stat={stats[3]} accent={colors.accent} />
                <StatRow stat={stats[4]} accent={colors.accent} />
                <StatRow stat={stats[5]} accent={colors.accent} />
              </View>
            </View>
          </View>
        </CardShell>
      </View>
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pressable,
        { width: scaledWidth, height: scaledHeight },
        pressed && styles.pressed,
      ]}
    >
      {card}
    </Pressable>
  );
}

function StatRow({ stat, accent }: { stat: Stat; accent: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statValue, { color: accent }]}>{stat.value}</Text>
      <Text style={[styles.statLabel, { color: accent }]}>{stat.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
  },
  viewport: {
    overflow: "hidden",
    position: "relative",
  },
  scaledRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transformOrigin: "top left" as any,
  },
  content: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 150,
  },
  leftMeta: {
    width: 52,
    alignItems: "center",
    paddingTop: 6,
  },
  rating: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 36,
  },
  position: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  playerImageWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  playerImage: {
    width: 128,
    height: 150,
  },
  placeholderImage: {
    width: 116,
    height: 136,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 28,
    letterSpacing: 1,
  },
  identitySection: {
    alignItems: "center",
    marginTop: 2,
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    maxWidth: "100%",
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  subText: {
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 72,
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 12,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  statsColumn: {
    width: "46%",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  statValue: {
    width: 34,
    fontSize: 16,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
