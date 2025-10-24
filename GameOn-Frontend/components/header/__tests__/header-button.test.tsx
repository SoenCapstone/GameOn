import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { HeaderButton } from "@/components/header/header-button";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock("expo-symbols", () => ({
  SymbolView: jest.fn(() => null),
}));

jest.mock("expo-glass-effect", () => ({
  GlassView: jest.fn(({ children }) => children),
}));

describe("HeaderButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("back button", () => {
    it("renders with chevron.left icon", () => {
      render(<HeaderButton type="back" />);

      const call = (SymbolView as jest.Mock).mock.calls[0][0];
      expect(call.name).toBe("chevron.left");
      expect(call.size).toBe(26);
      expect(call.tintColor).toBe("white");
    });

    it("calls router.back when pressed", () => {
      const { UNSAFE_getByProps } = render(<HeaderButton type="back" />);
      const pressable = UNSAFE_getByProps({ accessible: true });

      fireEvent.press(pressable);

      expect(router.back).toHaveBeenCalledTimes(1);
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  describe("custom button", () => {
    it("renders with custom icon", () => {
      render(<HeaderButton type="custom" icon="house.fill" route="/home" />);

      const call = (SymbolView as jest.Mock).mock.calls[0][0];
      expect(call.name).toBe("house.fill");
      expect(call.size).toBe(26);
      expect(call.tintColor).toBe("white");
    });

    it("calls router.push with route when pressed", () => {
      const { UNSAFE_getByProps } = render(
        <HeaderButton type="custom" icon="house.fill" route="/home" />,
      );
      const pressable = UNSAFE_getByProps({ accessible: true });

      fireEvent.press(pressable);

      expect(router.push).toHaveBeenCalledWith("/home");
      expect(router.back).not.toHaveBeenCalled();
    });
  });

  describe("common behavior", () => {
    it("renders GlassView with correct props", () => {
      render(<HeaderButton type="back" />);

      const call = (GlassView as jest.Mock).mock.calls[0][0];
      expect(call.glassEffectStyle).toBe("clear");
      expect(call.isInteractive).toBe(true);
      expect(call.style.width).toBe(44);
      expect(call.style.height).toBe(44);
    });

    it("renders SymbolView with correct styling props", () => {
      render(<HeaderButton type="back" />);

      const call = (SymbolView as jest.Mock).mock.calls[0][0];
      expect(call.tintColor).toBe("white");
      expect(call.size).toBe(26);
      expect(call.style.alignSelf).toBe("center");
    });
  });
});
