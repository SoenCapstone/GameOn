import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { Rect as SvgRect, Line, Path, ForeignObject } from "react-native-svg";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import type { Shape } from "@/types/playmaker";

type ElementWithProps<T> = React.ReactElement<T>;

jest.mock("expo-router", () => ({
  Color: {
    ios: {
      systemYellow: "systemYellow",
    },
  },
}));

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: (props: { [key: string]: unknown }) => null,
}));

describe("useRenderPlayMakerShapes", () => {
  const getPlayerImage = jest.fn(() => null);

  beforeEach(() => {
    getPlayerImage.mockClear();
    getPlayerImage.mockReturnValue(null);
  });

  it("returns empty array when shapes is empty", () => {
    const onSelect = jest.fn();

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes([], null, getPlayerImage, onSelect),
    );

    expect(result.current).toEqual([]);
  });

  it("renders a person shape with a hitbox and icon", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [
      {
        type: "person",
        id: "p1",
        x: 100,
        y: 200,
        size: 28,
      },
    ];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, getPlayerImage, onSelect),
    );

    expect(result.current).toHaveLength(1);

    const root = result.current[0];
    const children = (root.props as { children: React.ReactElement[] })
      .children;

    const hitRect = children.find(
      (child): child is ElementWithProps<{ onPress?: () => void }> =>
        child?.type === SvgRect,
    );
    const icon = children.find((child) => child?.type === ForeignObject);
    expect(hitRect).toBeTruthy();
    expect(icon).toBeTruthy();
    expect(hitRect?.props.onPress).toBeUndefined();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("does not render arrow when from/to is missing", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [{ type: "arrow", id: "a1" }];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, getPlayerImage, onSelect),
    );

    expect(result.current).toEqual([]);
  });

  it("renders arrow (Line + Path) and triggers onSelect when Line is pressed", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [
      {
        type: "arrow",
        id: "a1",
        from: { id: "from1", x: 10, y: 20 },
        to: { id: "to1", x: 110, y: 120 },
      },
    ];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, getPlayerImage, onSelect),
    );

    expect(result.current).toHaveLength(1);

    const root = result.current[0];
    const children = (root.props as { children: React.ReactElement[] })
      .children;

    const line = children.find(
      (c): c is ElementWithProps<{ onPress?: () => void }> => c?.type === Line,
    );
    const path = children.find((c): c is React.ReactElement => c?.type === Path);

    expect(line).toBeTruthy();
    expect(path).toBeTruthy();

    act(() => {
      if (
        line &&
        typeof line.props === "object" &&
        line.props &&
        "onPress" in line.props
      ) {
        (line.props as { onPress: () => void }).onPress();
      }
    });

    expect(onSelect).toHaveBeenCalledWith("a1");
  });

  it("offsets arrow endpoints away from person icon centers when sizes are provided", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [
      {
        type: "arrow",
        id: "a1",
        from: { id: "from1", x: 10, y: 20, size: 28 },
        to: { id: "to1", x: 110, y: 20, size: 28 },
      },
    ];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, getPlayerImage, onSelect),
    );

    const root = result.current[0];
    const children = (root.props as { children: React.ReactElement[] })
      .children;
    const line = children.find(
      (c): c is ElementWithProps<{
        x1?: number;
        y1?: number;
        x2?: number;
        y2?: number;
      }> => c?.type === Line,
    );

    expect(line).toBeTruthy();

    if (!line) {
      throw new Error("Expected arrow line to be rendered");
    }

    const { x1, y1, x2, y2 } = line.props;

    expect(x1).toBe(26);
    expect(y1).toBe(20);
    expect(x2).toBe(94);
    expect(y2).toBe(20);
  });
});
