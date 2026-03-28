import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { FifaStyleCard } from "./player-card";
import { CARD_WIDTH, CARD_HEIGHT } from "@/components/play-maker/shield-card";
import type { PersonShape } from "@/components/play-maker/model";

type PlayerCardsOverlayProps = {
  shapes: PersonShape[];
  selectedShapeId: string | null;
  onSelect: (id: string) => void;
  playersById?: Record<string, any>;
};

const getPlayerName = (player: any) => {
  if (!player) return "Player";
  return (
    player.name ||
    player.fullName ||
    [player.firstName, player.lastName].filter(Boolean).join(" ") ||
    "Player"
  );
};

const getPlayerPosition = (player: any) => {
  return (
    player.position ||
    player.primaryPosition ||
    player.role ||
    player.playerPosition ||
    "N/A"
  );
};

const getPlayerTeam = (player: any) => {
  return player.team || player.teamName || player.club || "";
};

const getPlayerNation = (player: any) => {
  return player.nation || player.country || player.nationality || "";
};

const getPlayerImage = (player: any) => {
  return player.image || player.avatar || player.photo || undefined;
};

export function PlayerCardsOverlay({
  shapes,
  selectedShapeId,
  onSelect,
  playersById,
}: PlayerCardsOverlayProps) {
  const safePlayersById = playersById ?? {};

  return (
    <>
      {shapes.map((shape) => {
        const player = shape.associatedPlayerId
          ? safePlayersById[String(shape.associatedPlayerId)]
          : undefined;

        if (!player) {
          return (
            <View
              key={shape.id}
              style={[
                styles.fallback,
                {
                  left: shape.x - 34,
                  top: shape.y - 14,
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.fallbackText}>No player</Text>
            </View>
          );
        }

        const isSelected = shape.id === selectedShapeId;
        const scale = isSelected ? 0.26 : 0.15;

        const cardWidth = CARD_WIDTH * scale;
        const cardHeight = CARD_HEIGHT * scale;

        return (
          <View
            key={shape.id}
            style={[
              styles.cardSlot,
              {
                left: shape.x - cardWidth / 2,
                top: shape.y - cardHeight / 2,
                width: cardWidth,
                height: cardHeight,
                zIndex: isSelected ? 2 : 1,
              },
            ]}
            pointerEvents="box-none"
          >
            <FifaStyleCard
              rating={player.rating ?? player.overall ?? 75}
              name={getPlayerName(player)}
              position={getPlayerPosition(player)}
              team={getPlayerTeam(player)}
              nation={getPlayerNation(player)}
              image={getPlayerImage(player)}
              cardType="special"
              stats={[
                { label: "PAC", value: player.pac ?? 70 },
                { label: "SHO", value: player.sho ?? 70 },
                { label: "PAS", value: player.pas ?? 70 },
                { label: "DRI", value: player.dri ?? 70 },
                { label: "DEF", value: player.def ?? 70 },
                { label: "PHY", value: player.phy ?? 70 },
              ]}
              scale={scale}
              onPress={() => onSelect(shape.id)}
            />
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  cardSlot: {
    position: "absolute",
  },
  fallback: {
    position: "absolute",
    backgroundColor: "rgba(255,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fallbackText: {
    color: "white",
    fontWeight: "700",
    fontSize: 11,
  },
});
