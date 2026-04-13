import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
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

function getStorageKey(userId: string | null | undefined) {
  return userId ? `${storageKey}:${userId}` : null;
}

async function getPreferences(
  userId: string | null | undefined,
): Promise<ExplorePreferences> {
  const userStorageKey = getStorageKey(userId);
  if (!userStorageKey) {
    return initialPreferences;
  }

  try {
    const json = await AsyncStorage.getItem(userStorageKey);
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
  const { userId } = useAuth();
  const [preferences, setPreferences] =
    useState<ExplorePreferences>(initialPreferences);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getPreferences(userId)
      .then(setPreferences)
      .finally(() => setIsLoaded(true));
  }, [userId]);

  const load = useCallback(async () => {
    const prefs = await getPreferences(userId);
    setPreferences(prefs);
    getCoordinates(prefs.location).then(setCoordinates);
    return prefs;
  }, [userId]);

  const save = useCallback(
    (prefs: ExplorePreferences) => {
      const userStorageKey = getStorageKey(userId);
      if (!userStorageKey) {
        return;
      }

      AsyncStorage.setItem(userStorageKey, JSON.stringify(prefs)).catch(
        (error) => {
          log.warn("Failed to save explore preferences", error);
        },
      );
    },
    [userId],
  );

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
