import React from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import {
  HeaderHeightProvider,
  useHeaderHeight,
} from "@/contexts/header-height-context";
import { HeaderHeightContext as RNHeaderHeightContext } from "@react-navigation/elements";

jest.mock("@react-navigation/elements", () => {
  const ReactModule =
    jest.requireActual<typeof import("react")>("react");
  return {
    HeaderHeightContext: ReactModule.createContext<number | undefined>(
      undefined,
    ),
  };
});

function createWrapper({
  measuredHeight,
  withProvider = false,
}: {
  measuredHeight?: number;
  withProvider?: boolean;
}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const content = withProvider ? (
      <HeaderHeightProvider>{children}</HeaderHeightProvider>
    ) : (
      children
    );

    return (
      <RNHeaderHeightContext.Provider value={measuredHeight}>
        {content}
      </RNHeaderHeightContext.Provider>
    );
  };
}

describe("header-height-context", () => {
  it("returns the measured header height without the provider", () => {
    const { result } = renderHook(() => useHeaderHeight(), {
      wrapper: createWrapper({ measuredHeight: 48 }),
    });

    expect(result.current).toBe(48);
  });

  it("falls back to zero when no measured header height is available", () => {
    const { result } = renderHook(() => useHeaderHeight(), {
      wrapper: createWrapper({ measuredHeight: undefined }),
    });

    expect(result.current).toBe(0);
  });

  it("caches the largest measured height inside the provider", async () => {
    let measuredHeight = 32;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RNHeaderHeightContext.Provider value={measuredHeight}>
        <HeaderHeightProvider>{children}</HeaderHeightProvider>
      </RNHeaderHeightContext.Provider>
    );

    const { result, rerender } = renderHook(() => useHeaderHeight(), {
      wrapper,
    });

    expect(result.current).toBe(32);

    measuredHeight = 64;
    rerender({});

    await waitFor(() => {
      expect(result.current).toBe(64);
    });

    measuredHeight = 24;
    rerender({});

    expect(result.current).toBe(64);
  });
});
