import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExplorePreferences } from "@/types/explore";
import { cityCoordinates } from "@/constants/explore";
import {
  getCurrentLocation,
  requestLocationPermission,
} from "@/utils/location";
import { createScopedLog } from "@/utils/logger";

const storageKey = "explore-preferences";
const log = createScopedLog("useExplorePreferences");

const initialPreferences: ExplorePreferences = {
  sport: undefined,
  location: undefined,
  rangeKm: undefined,
};

async function getCoordinates(
  location: string | undefined,
): Promise<{ latitude: number; longitude: number } | null> {
  if (!location) return null;

  if (location === "My Location") {
    return getCurrentLocation();
  }

  return cityCoordinates[location] ?? null;
}

async function getPreferences(): Promise<ExplorePreferences> {
  try {
    const json = await AsyncStorage.getItem(storageKey);
    if (json != null) {
      const preferences = JSON.parse(json) as Partial<ExplorePreferences>;
      return { ...initialPreferences, ...preferences };
    }
  } catch (error) {
    log.warn("Failed to load explore preferences", error);
  }
  return initialPreferences;
}

export function useExplorePreferences() {
  const [preferences, setPreferences] =
    useState<ExplorePreferences>(initialPreferences);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getPreferences()
      .then(setPreferences)
      .finally(() => setIsLoaded(true));
  }, []);

  const load = useCallback(() => {
    getPreferences().then((prefs) => {
      setPreferences(prefs);
      getCoordinates(prefs.location).then(setCoordinates);
    });
  }, []);

  const save = useCallback((prefs: ExplorePreferences) => {
    AsyncStorage.setItem(storageKey, JSON.stringify(prefs)).catch((error) => {
      log.warn("Failed to save explore preferences", error);
    });
  }, []);

  const setSport = useCallback(
    (value: string) => {
      setPreferences((prev) => {
        const updated = { ...prev, sport: value };
        save(updated);
        return updated;
      });
    },
    [save],
  );

  const setLocation = useCallback(
    (value: string) => {
      setPreferences((prev) => {
        const updated = { ...prev, location: value };
        save(updated);
        return updated;
      });

      if (value === "My Location") {
        void requestLocationPermission();
      }
    },
    [save],
  );

  const setRangeKm = useCallback(
    (value: number) => {
      setPreferences((prev) => {
        const updated = { ...prev, rangeKm: value };
        save(updated);
        return updated;
      });
    },
    [save],
  );

  return {
    preferences,
    coordinates,
    setSport,
    setLocation,
    setRangeKm,
    load,
    isLoaded,
  };
}
