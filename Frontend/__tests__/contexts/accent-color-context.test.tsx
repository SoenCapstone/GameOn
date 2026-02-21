import React from "react";
import { render, renderHook } from "@testing-library/react-native";
import { Text } from "react-native";
import {
  AccentColorProvider,
  useAccentColor,
} from "@/contexts/accent-color-context";
import { AccentColors } from "@/constants/colors";

describe("accent-color-context", () => {
  it("returns default accent color when no provider is present", () => {
    const { result } = renderHook(() => useAccentColor());
    expect(result.current).toBe(AccentColors.blue);
  });

  it("returns provider color when wrapped by AccentColorProvider", () => {
    const { result } = renderHook(() => useAccentColor(), {
      wrapper: ({ children }) => (
        <AccentColorProvider color={AccentColors.green}>
          {children}
        </AccentColorProvider>
      ),
    });

    expect(result.current).toBe(AccentColors.green);
  });

  it("updates value when provider color changes", () => {
    const AccentReader = () => {
      const color = useAccentColor();
      return <Text>{color}</Text>;
    };

    const { getByText, rerender } = render(
      <AccentColorProvider color={AccentColors.orange}>
        <AccentReader />
      </AccentColorProvider>,
    );

    expect(getByText(AccentColors.orange)).toBeTruthy();

    rerender(
      <AccentColorProvider color={AccentColors.red}>
        <AccentReader />
      </AccentColorProvider>,
    );
    expect(getByText(AccentColors.red)).toBeTruthy();
  });
});
