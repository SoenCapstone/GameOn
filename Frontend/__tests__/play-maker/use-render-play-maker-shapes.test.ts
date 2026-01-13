import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { Rect as SvgRect, Line, Path } from "react-native-svg";
import { useRenderPlayMakerShapes } from "@/hooks/use-render-play-maker-shapes"; // adjust path
import { Shape } from "@/components/play-maker/model";

jest.mock("@/components/play-maker/play-maker-icon/icon-container", () => ({
  IconContainer: (props: any) => null,
}));


describe("useRenderPlayMakerShapes", () => {
  it("returns empty array when shapes is empty", () => {
    const onSelect = jest.fn();

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes([], null, onSelect)
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
      } as any,
    ];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, onSelect)
    );

    expect(result.current).toHaveLength(1);

    const root = result.current[0] as React.ReactElement<any>;
    const children = root.props.children as any[];

    const hitRect = children.find((child) => child?.type === SvgRect);
    expect(hitRect).toBeTruthy();

    act(() => {
      hitRect.props.onPress();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("p1");
  });

  it("does not render arrow when from/to is missing", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [{ type: "arrow", id: "a1" } as any];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, onSelect)
    );

    expect(result.current).toEqual([]);
  });

  it("renders arrow (Line + Path) and triggers onSelect when Line is pressed", () => {
    const onSelect = jest.fn();

    const shapes: Shape[] = [
      {
        type: "arrow",
        id: "a1",
        from: { x: 10, y: 20 },
        to: { x: 110, y: 120 },
      } as any,
    ];

    const { result } = renderHook<React.ReactElement[], unknown>(() =>
      useRenderPlayMakerShapes(shapes, null, onSelect)
    );

    expect(result.current).toHaveLength(1);

    const root = result.current[0] as React.ReactElement<any>;
    const children = root.props.children as any[];

    const line = children.find((c) => c?.type === Line);
    const path = children.find((c) => c?.type === Path);

    expect(line).toBeTruthy();
    expect(path).toBeTruthy();

    act(() => {
      line.props.onPress();
    });

    expect(onSelect).toHaveBeenCalledWith("a1");
  });
});
