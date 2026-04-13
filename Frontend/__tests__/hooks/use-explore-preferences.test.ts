import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useExplorePreferences } from "@/hooks/use-explore-preferences";
import {
  getCurrentLocation,
  requestLocationPermission,
} from "@/utils/location";

jest.mock("@/utils/location", () => ({
  getCurrentLocation: jest.fn(),
  requestLocationPermission: jest.fn(),
}));

jest.mock("@/utils/logger", () => ({
  __mockWarn: jest.fn(),
  createScopedLog: jest.fn(() => ({
    warn: jest.requireMock("@/utils/logger").__mockWarn,
    info: jest.fn(),
    error: jest.fn(),
  })),
}));

describe("useExplorePreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    (getCurrentLocation as jest.Mock).mockResolvedValue(null);
    (requestLocationPermission as jest.Mock).mockResolvedValue(true);
  });

  it("loads saved preferences on mount and marks the hook as loaded", async () => {
    await AsyncStorage.setItem(
      "explore-preferences",
      JSON.stringify({
        sport: "Basketball",
        location: "Toronto",
        rangeKm: 25,
      }),
    );

    const { result } = renderHook(() => useExplorePreferences());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.preferences).toEqual({
      sport: "Basketball",
      location: "Toronto",
      rangeKm: 25,
    });
    expect(result.current.coordinates).toBeNull();
  });

  it("persists sport and range changes", async () => {
    const { result } = renderHook(() => useExplorePreferences());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setSport("Soccer");
      result.current.setRangeKm(50);
    });

    expect(result.current.preferences).toEqual({
      sport: "Soccer",
      location: undefined,
      rangeKm: 50,
    });
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      "explore-preferences",
      JSON.stringify({
        sport: "Soccer",
        location: undefined,
        rangeKm: 50,
      }),
    );
  });

  it("requests location permission when the user selects My Location", async () => {
    const { result } = renderHook(() => useExplorePreferences());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setLocation("My Location");
    });

    expect(requestLocationPermission).toHaveBeenCalledTimes(1);
    expect(result.current.preferences.location).toBe("My Location");
  });

  it("does not request location permission for non-location presets", async () => {
    const { result } = renderHook(() => useExplorePreferences());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setLocation("Toronto");
    });

    expect(requestLocationPermission).not.toHaveBeenCalled();
    expect(result.current.preferences.location).toBe("Toronto");
  });

  it("loads city coordinates for a saved city preference", async () => {
    await AsyncStorage.setItem(
      "explore-preferences",
      JSON.stringify({
        sport: "Soccer",
        location: "Toronto",
        rangeKm: 10,
      }),
    );

    const { result } = renderHook(() => useExplorePreferences());

    await act(async () => {
      await result.current.load();
    });

    await waitFor(() => {
      expect(result.current.coordinates).toEqual({
        latitude: 43.65391000329953,
        longitude: -79.38046343249734,
      });
    });
  });

  it("loads the user's current coordinates when My Location is saved", async () => {
    (getCurrentLocation as jest.Mock).mockResolvedValue({
      latitude: 45.5,
      longitude: -73.56,
    });
    await AsyncStorage.setItem(
      "explore-preferences",
      JSON.stringify({
        sport: "Soccer",
        location: "My Location",
        rangeKm: 10,
      }),
    );

    const { result } = renderHook(() => useExplorePreferences());

    await act(async () => {
      await result.current.load();
    });

    await waitFor(() => {
      expect(result.current.coordinates).toEqual({
        latitude: 45.5,
        longitude: -73.56,
      });
    });
    expect(getCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it("keeps coordinates null when no location preference is saved", async () => {
    const { result } = renderHook(() => useExplorePreferences());

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.coordinates).toBeNull();
  });

  it("returns null coordinates for an unknown saved location", async () => {
    await AsyncStorage.setItem(
      "explore-preferences",
      JSON.stringify({
        sport: "Soccer",
        location: "Quebec City",
        rangeKm: 10,
      }),
    );

    const { result } = renderHook(() => useExplorePreferences());

    await act(async () => {
      await result.current.load();
    });

    expect(result.current.coordinates).toBeNull();
  });

  it("falls back to initial preferences when loading from storage fails", async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error("read failed"),
    );

    const { result } = renderHook(() => useExplorePreferences());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.preferences).toEqual({
      sport: undefined,
      location: undefined,
      rangeKm: undefined,
    });
    expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalledWith(
      "Failed to load explore preferences",
      expect.any(Error),
    );
  });

  it("logs a warning when saving preferences fails", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error("save failed"),
    );

    const { result } = renderHook(() => useExplorePreferences());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.setSport("Soccer");
    });

    await waitFor(() => {
      expect(jest.requireMock("@/utils/logger").__mockWarn).toHaveBeenCalledWith(
        "Failed to save explore preferences",
        expect.any(Error),
      );
    });
  });
});
