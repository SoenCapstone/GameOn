import { useMemo } from "react";
import { Shape } from "@/components/play-maker/model";
import { Rect as SvgRect, Line, G, Path } from "react-native-svg";
import { IconContainer } from "@/components/play-maker/play-maker-icon/icon-container";
import { PERSON_SVG } from "@/components/play-maker/play-maker-icon/constants";

type OnSelect = (id: string) => void;

type RendererMap = {
  [K in Shape["type"]]: (
    shape: Extract<Shape, { type: K }>,
    isSelected: boolean,
    selectedShapeId: string | null,
    onSelect: OnSelect
  ) => React.ReactElement | null;
};

const renderers: RendererMap = {
  select: () => null,

  person: (s, isSelected, _selectedId, onSelect) => {
    const size = s.size ?? 28;
    const hitPadding = 8;

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
          onPress={() => onSelect(s.id)}
        />

        <IconContainer
          size={isSelected ? size * 1.25 : size}
          xml={PERSON_SVG.replace(
            /currentColor/g,
            isSelected ? "#4ade80" : "white"
          )}
        />
      </G>
    );
  },

  arrow: (s, isSelected, _selectedId, onSelect) => {
    if (!s.from || !s.to) return null;

    const stroke = isSelected ? "#4ade80" : "rgba(255,255,255,0.85)";
    const strokeWidth = isSelected ? 4 : 3;

    const x1 = s.from.x;
    const y1 = s.from.y;
    const x2 = s.to.x;
    const y2 = s.to.y;

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
  onSelect: OnSelect
) => {
  return useMemo(() => {
    return shapes
      .map((s) => {
        const isSelected = "id" in s && s.id === selectedShapeId;
        return renderers[s.type](
          s as any,
          isSelected,
          selectedShapeId,
          onSelect
        );
      })
      .filter(Boolean) as React.ReactElement[];
  }, [shapes, selectedShapeId, onSelect]);
};

const buildArrowPath = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  headLength = 14,
  headAngle = Math.PI / 6
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
