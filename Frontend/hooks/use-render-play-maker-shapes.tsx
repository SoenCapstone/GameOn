import { useMemo, ReactElement } from "react";
import type { Shape } from "@/types/playmaker";
import { StyleSheet, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";
import { Color } from "expo-router";
import {
  Rect as SvgRect,
  Line,
  G,
  Path,
  ForeignObject,
} from "react-native-svg";

type OnSelect = (id: string) => void;
type GetPlayerImage = (playerId?: string) => string | null;

type RendererMap = {
  [K in Shape["type"]]: (
    shape: Extract<Shape, { type: K }>,
    isSelected: boolean,
    selectedShapeId: string | null,
    getPlayerImage: GetPlayerImage,
    onSelect: OnSelect,
  ) => ReactElement | null;
};

const renderers: RendererMap = {
  select: () => null,

  person: (s, isSelected, _selectedId, getPlayerImage, _onSelect) => {
    const size = s.size ?? 28;
    const hitPadding = 8;
    const iconSize = isSelected ? size * 1.1 : size;
    const playerImage = getPlayerImage(s.associatedPlayerId);
    const avatarSize = size * 1.35;
    const renderSize = playerImage ? avatarSize : iconSize;
    const renderOffset = (size - renderSize) / 2;

    const left = s.x - size / 2;
    const top = s.y - size / 2;

    return (
      <G key={s.id} transform={`translate(${left}, ${top})`}>
        <SvgRect
          x={-hitPadding}
          y={-hitPadding}
          width={size + hitPadding * 2}
          height={size + hitPadding * 2}
          fill="transparent"
        />

        <ForeignObject
          x={renderOffset}
          y={renderOffset}
          width={renderSize}
          height={renderSize}
          pointerEvents="none"
        >
          <View pointerEvents="none" style={styles.iconContainer}>
            {playerImage ? (
              <View
                style={[
                  styles.avatarFrame,
                  {
                    width: renderSize,
                    height: renderSize,
                    borderRadius: renderSize / 2,
                    borderColor: isSelected
                      ? Color.ios.systemYellow
                      : "transparent",
                  },
                ]}
              >
                <Image
                  source={{ uri: playerImage }}
                  style={{
                    width: renderSize,
                    height: renderSize,
                    borderRadius: renderSize / 2,
                  }}
                  contentFit="cover"
                />
              </View>
            ) : (
              <IconSymbol
                name="person.fill"
                size={iconSize}
                color={isSelected ? Color.ios.systemYellow : "white"}
              />
            )}
          </View>
        </ForeignObject>
      </G>
    );
  },

  arrow: (s, isSelected, _selectedId, _getPlayerImage, onSelect) => {
    if (!s.from || !s.to) return null;

    const stroke = isSelected
      ? Color.ios.systemYellow
      : "rgba(255,255,255,0.85)";
    const strokeWidth = isSelected ? 4 : 3;
    const { x1, y1, x2, y2 } = getArrowEndpoints(s.from, s.to);
    const d = buildArrowPath(x1, y1, x2, y2);

    return (
      <G key={s.id}>
        <Line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="transparent"
          strokeWidth={isSelected ? 32 : 24}
          onPress={() => onSelect(s.id)}
        />

        <Path
          d={d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </G>
    );
  },
};

export const useRenderPlayMakerShapes = (
  shapes: Shape[],
  selectedShapeId: string | null,
  getPlayerImage: GetPlayerImage,
  onSelect: OnSelect,
) => {
  return useMemo(() => {
    return shapes
      .map((s) => {
        const isSelected = "id" in s && s.id === selectedShapeId;
        switch (s.type) {
          case "person":
            return renderers.person(
              s,
              isSelected,
              selectedShapeId,
              getPlayerImage,
              onSelect,
            );
          case "arrow":
            return renderers.arrow(
              s,
              isSelected,
              selectedShapeId,
              getPlayerImage,
              onSelect,
            );
          case "select":
            return renderers.select(
              s,
              isSelected,
              selectedShapeId,
              getPlayerImage,
              onSelect,
            );
          default:
            return null;
        }
      })
      .filter(Boolean) as React.ReactElement[];
  }, [getPlayerImage, shapes, selectedShapeId, onSelect]);
};

const buildArrowPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLength = 14,
  headAngle = Math.PI / 6,
) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);

  const hx1 = x2 - headLength * Math.cos(angle - headAngle);
  const hy1 = y2 - headLength * Math.sin(angle - headAngle);

  const hx2 = x2 - headLength * Math.cos(angle + headAngle);
  const hy2 = y2 - headLength * Math.sin(angle + headAngle);

  return `M ${x1} ${y1} L ${x2} ${y2} 
          M ${x2} ${y2} L ${hx1} ${hy1}
          M ${x2} ${y2} L ${hx2} ${hy2}`;
};

const getArrowEndpoints = (
  from: NonNullable<Shape["from"]>,
  to: NonNullable<Shape["to"]>,
) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
    };
  }

  const unitX = dx / distance;
  const unitY = dy / distance;
  const endpointGap = 2;
  const fromOffset = (from.size ?? 0) / 2 + endpointGap;
  const toOffset = (to.size ?? 0) / 2 + endpointGap;
  const maxOffset = Math.max(distance / 2 - 1, 0);
  const safeFromOffset = Math.min(fromOffset, maxOffset);
  const safeToOffset = Math.min(toOffset, maxOffset);

  return {
    x1: from.x + unitX * safeFromOffset,
    y1: from.y + unitY * safeFromOffset,
    x2: to.x - unitX * safeToOffset,
    y2: to.y - unitY * safeToOffset,
  };
};

const styles = StyleSheet.create({
  iconContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFrame: {
    borderWidth: 1,
    overflow: "hidden",
  },
});
