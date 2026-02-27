import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { Rect as SvgRect, Line, Path } from "react-native-svg";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes";
import { Shape } from "@/components/play-maker/model";

jest.mock("@/components/play-maker/play-maker-icon/icon-container", () => ({
  IconContainer: (props: { [key: string]: unknown }) => null,
}));

describe("useRenderPlayMakerShapes", () => {
  it("returns empty array when shapes is empty", () => {
    const onSelect = jest.fn();

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes([], null, onSelect),
    );

    expect(result.current).toEqual([]);
  });

  it("renders a person shape and triggers onSelect when hitbox is pressed", () => {
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
      useRenderPlayMakerShapes(shapes, null, onSelect),
    );

    expect(result.current).toHaveLength(1);

    const root = result.current[0] as React.ReactElement;
    const children = (root.props as { children: React.ReactElement[] })
      .children;

    const hitRect = children.find((child) => child?.type === SvgRect);
    expect(hitRect).toBeTruthy();

    act(() => {
      if (
        hitRect &&
        typeof hitRect.props === "object" &&
        hitRect.props &&
        "onPress" in hitRect.props
      ) {
        (hitRect.props as { onPress: () => void }).onPress();
      }
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("does not render arrow when from/to is missing", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [{ type: "arrow", id: "a1" }];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, onSelect),
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
      useRenderPlayMakerShapes(shapes, null, onSelect),
    );

    expect(result.current).toHaveLength(1);

    const root = result.current[0] as React.ReactElement;
    const children = (root.props as { children: React.ReactElement[] })
      .children;

    const line = children.find((c) => c?.type === Line);
    const path = children.find((c) => c?.type === Path);

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
});
